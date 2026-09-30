/* ==========================================================================
   STORE — 앱 상태 엔진
   --------------------------------------------------------------------------
   핵심 순환 구조를 실제로 동작시킵니다:

     산행 완료 → 기록 추가 → 통계 재계산 → AI 분석 갱신 → 다음 추천 변경

   모든 파생 값(평균 거리/고도/주기, 난이도 추세, 홈 화면 단계)은
   저장된 records 로부터 "계산"됩니다. 화면에 숫자를 박아넣지 않습니다.
   데이터가 없으면 파생 값도 비어 있고, 홈은 신규 사용자 상태로 바뀝니다.
   ========================================================================== */
window.HHC = window.HHC || {};

(function () {
  const STORAGE_KEY = 'hhc.state.v1';

  const DEFAULT_STATE = {
    profile: null,          // { name, age, gender, weight, height, experience, preference, goal, plan, wearable }
    records: [],            // 산행 기록 배열 (최신순 정렬 유지)
    prefs: {
      theme: 'default',
      buttonShape: 'pill',
      customPrimary: null,
      customSecondary: null,
      units: 'metric',
      notifications: true
    },
    ui: {
      homeStageSeen: {},    // 신규→1회→다수 전환 안내 1회 노출 관리
      onboardedAt: null
    }
  };

  let state = load();
  const listeners = new Set();

  /* --------------------------- persistence --------------------------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return Object.assign(structuredClone(DEFAULT_STATE), parsed, {
        prefs: Object.assign({}, DEFAULT_STATE.prefs, parsed.prefs || {}),
        ui: Object.assign({}, DEFAULT_STATE.ui, parsed.ui || {})
      });
    } catch (e) {
      return structuredClone(DEFAULT_STATE);
    }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }
  function emit() { listeners.forEach((fn) => fn(state)); }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function get() { return state; }

  /* --------------------------- mutations ---------------------------- */
  function saveProfile(profile) {
    state.profile = Object.assign({}, state.profile, profile);
    if (!state.ui.onboardedAt) state.ui.onboardedAt = Date.now();
    persist(); emit();
    return state.profile;
  }

  function addRecord(record) {
    const rec = Object.assign({
      id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: Date.now(),
      courseId: null,
      name: '산행',
      distance: 0,
      duration: 0,       // 초
      ascent: 0,
      descent: 0,
      avgPace: 0,        // 분/km
      calories: 0,
      level: 2,
      maxAlt: 0,
      paceStability: 0,  // 0~100
      splits: []
    }, record);
    state.records.unshift(rec);
    state.records.sort((a, b) => b.date - a.date);
    persist(); emit();
    return rec;
  }

  function deleteRecord(id) {
    state.records = state.records.filter((r) => r.id !== id);
    persist(); emit();
  }

  function resetAll() {
    state = structuredClone(DEFAULT_STATE);
    state.prefs = Object.assign({}, DEFAULT_STATE.prefs, { theme: 'default', buttonShape: 'pill' });
    persist(); emit();
  }

  function setPref(key, value) {
    state.prefs[key] = value;
    persist(); emit();
  }

  function setUi(key, value) {
    state.ui[key] = value;
    persist();
  }

  /* --------------------- 파생 통계 (개인화 엔진) --------------------- */

  function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }

  /* 최근 절반 vs 이전 절반 비교 → 변화율 */
  function changeRate(values) {
    if (values.length < 2) return 0;
    const mid = Math.ceil(values.length / 2);
    const recent = values.slice(0, mid);       // 최신순 정렬 가정
    const older = values.slice(mid);
    if (!older.length) return 0;
    const a = mean(recent), b = mean(older);
    if (!b) return 0;
    return ((a - b) / b) * 100;
  }

  /**
   * getStats() — 모든 화면이 참조하는 단일 통계 소스.
   * 데이터가 없으면 hasData:false 를 돌려주고, 존재하지 않는 값을 지어내지 않습니다.
   */
  function getStats() {
    const recs = state.records; // 최신순
    const count = recs.length;

    const base = {
      count,
      hasData: count > 0,
      hasEnoughData: count >= 3,
      stage: count === 0 ? 'new' : (count < 3 ? 'growing' : 'personalized')
    };
    if (!count) return base;

    const distances = recs.map((r) => r.distance);
    const ascents = recs.map((r) => r.ascent);
    const durations = recs.map((r) => r.duration);
    const levels = recs.map((r) => r.level || 2);
    const paces = recs.filter((r) => r.avgPace > 0).map((r) => r.avgPace);

    /* 산행 간격(일) — 가장 개인화의 핵심 지표 */
    const gaps = [];
    for (let i = 0; i < recs.length - 1; i++) {
      gaps.push((recs[i].date - recs[i + 1].date) / 86400000);
    }
    const notableGaps = gaps.filter((g) => g >= 0.5); // 같은 날 중복 제외

    /* 평균 집계 */
    const avgDistance = mean(distances);
    const avgAscent = mean(ascents);
    const avgDuration = mean(durations);
    const avgGap = notableGaps.length ? mean(notableGaps) : null;
    const avgPace = mean(paces);
    const avgLevel = mean(levels);

    /* 최근 산행 이후 경과일 */
    const daysSinceLast = (Date.now() - recs[0].date) / 86400000;

    /* 변화율 (최근 vs 이전) */
    const distanceTrend = changeRate(distances);
    const ascentTrend = changeRate(ascents);
    const paceStability = mean(recs.map((r) => r.paceStability || 0));
    const stabilityTrend = changeRate(recs.map((r) => r.paceStability || 0));

    /* 총 누적 */
    const totalDistance = sum(distances);
    const totalAscent = sum(ascents);
    const totalDuration = sum(durations);
    const totalCalories = sum(recs.map((r) => r.calories || 0));

    /* 선호 난이도 — 최빈값 */
    const counts = {};
    levels.forEach((l) => { counts[l] = (counts[l] || 0) + 1; });
    const preferredLevel = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);

    /* 추세 판정 */
    let trendDirection = 'flat';               // flat | up | down
    const combined = (distanceTrend + ascentTrend) / 2;
    if (combined > 3) trendDirection = 'up';
    else if (combined < -3) trendDirection = 'down';

    return Object.assign(base, {
      avgDistance, avgAscent, avgDuration, avgGap, avgPace, avgLevel,
      totalDistance, totalAscent, totalDuration, totalCalories,
      daysSinceLast, distanceTrend, ascentTrend, stabilityTrend, paceStability,
      preferredLevel, trendDirection,
      last: recs[0],
      previous: recs[1] || null,
      records: recs,
      /* 최근 6회 시계열 (오래된 → 최신, 그래프용) */
      series: recs.slice(0, 8).reverse()
    });
  }

  /* --------------------- AI 분석 텍스트 생성기 --------------------- */
  /**
   * buildAnalysis() — 통계로부터 AI 피드백 문장을 생성.
   * records 가 늘면 문장도 실제로 달라집니다.
   */
  function buildAnalysis() {
    const s = getStats();
    if (!s.hasData) {
      return { headline: '아직 분석할 산행 데이터가 없습니다.', points: [], confidence: 0 };
    }
    const p = [], first = s.last;

    if (s.count === 1) {
      p.push({ icon: 'fa-flag-checkered', text: `첫 산행을 완료했습니다. ${first.distance.toFixed(1)}km · ${fmtDur(first.duration)} · +${Math.round(first.ascent)}m 기록이 AI 학습의 시작점이 됩니다.` });
      p.push({ icon: 'fa-brain', text: '아직 비교할 이전 데이터가 없어 이번 기록을 기준선(baseline)으로 저장했습니다.' });
      p.push({ icon: 'fa-route', text: '다음 산행부터 이 기준선과 비교해 난이도를 조정해 추천합니다.' });
      return { headline: '첫 산행 데이터를 분석했습니다.', points: p, confidence: 1, baseline: true };
    }

    /* 거리 변화 */
    const d = s.distanceTrend;
    if (Math.abs(d) >= 1) {
      p.push({
        icon: d > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down',
        text: `지난 산행보다 거리는 약 ${Math.abs(d).toFixed(0)}% ${d > 0 ? '증가' : '감소'}했습니다.`
      });
    } else {
      p.push({ icon: 'fa-equals', text: '거리는 지난 산행과 거의 동일하게 유지되었습니다.' });
    }

    /* 고도 변화 */
    const a = s.ascentTrend;
    if (Math.abs(a) >= 2) {
      p.push({
        icon: a > 0 ? 'fa-mountain' : 'fa-mountain-sun',
        text: `고도 상승량은 약 ${Math.abs(a).toFixed(0)}% ${a > 0 ? '늘었습니다' : '줄었습니다'}. ${a > 0 ? '오르막 적응력이 향상되고 있습니다.' : '체력 배분을 다시 점검해 보세요.'}`
      });
    }

    /* 페이스 안정성 */
    if (s.paceStability >= 75) {
      p.push({ icon: 'fa-wave-square', text: `오르막 구간에서 평균 페이스가 안정적으로 유지되었습니다 (안정성 ${Math.round(s.paceStability)}/100).` });
    } else if (s.paceStability > 0) {
      p.push({ icon: 'fa-wave-square', text: `구간별 페이스 편차가 있습니다 (안정성 ${Math.round(s.paceStability)}/100). 초반 속도를 조금 줄여보세요.` });
    }

    /* 산행 간격 기반 조언 — "빈도 학습" 표현 */
    if (s.avgGap !== null) {
      const gapTxt = s.avgGap.toFixed(0);
      if (s.daysSinceLast > s.avgGap * 1.6) {
        p.push({ icon: 'fa-clock-rotate-left', text: `평소 산행 주기는 약 ${gapTxt}일인데 이번엔 ${Math.round(s.daysSinceLast)}일이 지났습니다. 몸을 다시 적응시키는 관점에서 난이도를 낮춰 추천합니다.` });
      } else if (s.avgGap <= 10 && s.trendDirection === 'up') {
        p.push({ icon: 'fa-dumbbell', text: `최근 약 ${gapTxt}일 간격으로 꾸준히 산행하고 있습니다. 같은 난이도에서 페이스를 더 끌어올려 볼 수 있습니다.` });
      } else {
        p.push({ icon: 'fa-clock-rotate-left', text: `평소 산행 주기는 약 ${gapTxt}일입니다. 이 주기를 기준으로 다음 산행을 계획하면 무리 없이 유지할 수 있습니다.` });
      }
    }

    /* 다음 난이도 제안 */
    if (s.trendDirection === 'up') {
      p.push({ icon: 'fa-arrow-up-right-dots', text: '다음 산행에서는 현재 난이도를 유지하거나 약간 높은 난이도에 도전할 수 있습니다.' });
    } else if (s.trendDirection === 'down') {
      p.push({ icon: 'fa-shield-heart', text: '최근 기록이 다소 낮아졌습니다. 다음 산행은 비슷하거나 조금 낮은 난이도로 회복하는 것을 권장합니다.' });
    } else {
      p.push({ icon: 'fa-scale-balanced', text: '현재 난이도를 유지하면서 거리나 고도를 조금씩 늘려가는 단계입니다.' });
    }

    return {
      headline: s.hasEnoughData ? '산행 패턴이 개인화 단계에 들어섰습니다.' : '산행 데이터를 분석했습니다.',
      points: p,
      confidence: Math.min(96, 42 + s.count * 9)
    };
  }

  /* --------------------- 다음 산행 추천 엔진 --------------------- */

  /**
   * recommendNext() — 이전 산행 기록 + 산행 간격 + 체력 추세 + 날씨 + 목표를
   * 종합해 "다음 산행"을 추천합니다. 신규 사용자는 입력 정보 기반.
   */
  function recommendNext() {
    const s = getStats();
    const profile = state.profile || {};
    const courses = HHC.COURSES;

    /* ---- 1) 목표 난이도 / 거리 결정 ---- */
    let targetLevel, targetDistance, basis, reasons = [];

    if (!s.hasData) {
      /* 신규 사용자 — 입력 정보 기반 (기록 없음) */
      const prefToLevel = { light: 1, moderate: 2, challenge: 3 };
      const expToLevel = { new: 1, casual: 2, regular: 3 };
      targetLevel = Math.round(((prefToLevel[profile.preference] || 2) + (expToLevel[profile.experience] || 1)) / 2);
      const levelDist = { 1: 4.5, 2: 6.8, 3: 8.5, 4: 11 };
      targetDistance = levelDist[targetLevel] || 6.5;
      basis = 'basic';
      reasons.push(`등산 경험은 <strong>${(HHC.ONBOARDING.experience.find((o) => o.value === profile.experience) || {}).title || '입력 정보'}</strong> 수준입니다.`);
      reasons.push(`선호 난이도(<strong>${(HHC.ONBOARDING.preference.find((o) => o.value === profile.preference) || {}).title || '미입력'}</strong>)에 맞춰 첫 산행 부담을 낮췄습니다.`);
      reasons.push('아직 산행 기록이 없어 <strong>입력 정보 + 코스 데이터 + 날씨</strong>만으로 추천했습니다.');
    } else {
      /* 기존 사용자 — 실제 기록 기반 */
      const avgLevel = s.avgLevel;
      const gap = s.avgGap;

      // 기본은 평균 난이도 유지, 추세와 간격으로 보정
      let adj = 0;
      if (s.trendDirection === 'up') adj += 0.5;
      if (s.trendDirection === 'down') adj -= 0.5;

      // 산행 간격이 평소보다 길면 난이도 하향
      if (gap !== null && s.daysSinceLast > gap * 1.6) adj -= 0.5;
      // 자주 + 상승 추세면 도전 허용
      if (gap !== null && gap <= 12 && s.trendDirection === 'up') adj += 0.25;
      // 첫 산행 1회뿐이면 유지
      if (s.count === 1) adj = 0;

      targetLevel = Math.max(1, Math.min(4, Math.round(avgLevel + adj)));
      targetDistance = s.avgDistance * (s.count === 1 ? 1.02 : (adj > 0 ? 1.08 : adj < 0 ? 0.92 : 1.01));
      basis = s.hasEnoughData ? 'personalized' : 'partial';

      reasons.push(`최근 ${s.count}회 평균 거리 <strong>${s.avgDistance.toFixed(1)}km</strong>, 평균 고도 상승 <strong>+${Math.round(s.avgAscent)}m</strong>를 기준으로 했습니다.`);

      if (gap !== null) {
        if (s.daysSinceLast > gap * 1.6) {
          reasons.push(`최근 산행 간격 <strong>${Math.round(s.daysSinceLast)}일</strong>로 평소 주기(${gap.toFixed(0)}일)보다 길어 <strong>이전보다 낮은 난이도</strong>를 추천합니다.`);
        } else if (s.trendDirection === 'up') {
          reasons.push(`최근 산행에서 거리와 고도 상승량이 꾸준히 증가해 <strong>지난 산행보다 약 10% 높은 난이도</strong>의 코스를 추천합니다.`);
        } else if (s.trendDirection === 'down') {
          reasons.push('최근 기록이 다소 낮아져 <strong>회복 중심</strong>으로 코스를 구성했습니다.');
        } else {
          reasons.push(`평소 산행 주기(<strong>${gap.toFixed(0)}일</strong>)를 고려해 무리하지 않고 이전과 비슷한 난이도를 추천합니다.`);
        }
      }
    }

    /* ---- 2) 날씨 보정 ---- */
    const w = HHC.WEATHER;
    if (w.rain >= 50) {
      targetLevel = Math.max(1, targetLevel - 1);
      reasons.push(`예정일 강수 확률이 <strong>${w.rain}%</strong>로 높아 안전을 위해 난이도를 낮췄습니다.`);
    } else if (w.tempMax <= 12) {
      reasons.push(`예정일 최고 기온이 <strong>${w.tempMax}°C</strong>로 낮아 코스 길이를 감안한 보온 준비가 필요합니다.`);
    } else {
      reasons.push(`예정일 날씨는 <strong>${w.condition} · ${w.tempMin}~${w.tempMax}°C</strong>로 산행에 적합합니다.`);
    }

    /* ---- 3) 코스 스코어링 ---- */
    const scored = courses.map((c) => {
      const diffLevel = Math.abs(c.level - targetLevel);
      const diffDist = targetDistance ? Math.abs(c.distance - targetDistance) / Math.max(targetDistance, 1) : 0;
      let score = 100 - diffLevel * 26 - diffDist * 30;

      // 이미 다녀온 코스는 감점 (새로움) — 2회 이상 다녀온 곳은 크게 감점
      const times = s.records ? s.records.filter((r) => r.courseId === c.id).length : 0;
      if (times === 1) score -= 12;
      if (times >= 2) score -= 26;

      // 목표 반영
      const goal = profile.goal;
      if (goal === 'fitness' && c.ascent > 450) score += 5;
      if (goal === 'stress' && c.tags.includes('숲길')) score += 5;
      if (goal === 'newcourse') score += 2;
      if (goal === 'light' && c.level === 1) score += 5;
      if (profile.preference === 'challenge' && c.level >= 3) score += 4;
      if (profile.preference === 'light' && c.level === 1) score += 5;

      return { course: c, score };
    }).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 3).map((entry, i) => Object.assign({}, entry.course, {
      rank: i + 1,
      matched: entry.score,
      reasonText: pickReason(entry.course, { s, basis, profile, targetLevel })
    }));

    return {
      basis,
      targetLevel,
      targetDistance,
      reasons,
      courses: top,
      weather: w,
      confidence: s.hasData ? Math.min(96, 45 + s.count * 8) : 62
    };
  }

  /* 코스별 한 줄 추천 이유 */
  function pickReason(course, ctx) {
    const { s, basis, profile } = ctx;
    if (basis === 'basic') {
      const exp = (HHC.ONBOARDING.experience.find((o) => o.value === profile.experience) || {}).title || '입력하신';
      const pref = (HHC.ONBOARDING.preference.find((o) => o.value === profile.preference) || {}).title || '선호도';
      return `${exp} 사용자이며 ${pref}를 선호하는 점을 고려해 처음 도전하기 좋은 코스로 추천했습니다.`;
    }
    if (s.count === 1) {
      return `첫 산행 기록(${s.last.distance.toFixed(1)}km · +${Math.round(s.last.ascent)}m)을 기준선으로 삼아 비슷한 체력 부담의 코스를 추천했습니다.`;
    }
    if (s.trendDirection === 'up') {
      return `최근 산행 거리와 고도 상승량을 고려했을 때 현재 체력 수준에서 한 단계 도전해 볼 수 있는 코스입니다.`;
    }
    if (s.trendDirection === 'down') {
      return `최근 기록을 반영해 무리 없이 회복할 수 있는 난이도의 코스입니다.`;
    }
    return `최근 산행 거리(${s.avgDistance.toFixed(1)}km)와 고도 상승량(+${Math.round(s.avgAscent)}m)을 고려했을 때 현재 체력 수준에 적합한 코스입니다.`;
  }

  /* --------------------- 이번 산행 목표 카드 --------------------- */
  function buildGoalPlan(course) {
    const s = getStats();
    const goalText = {
      fitness: '오르막 구간에서 일정한 페이스 유지',
      health: '무리 없는 심박 구간 유지',
      stress: '호흡을 정리하며 경치 감상 구간 확보',
      newcourse: '새 코스 경로 파악 · 이탈 방지',
      light: '천천히 완주 · 컨디션 확인'
    };
    const baseGoal = goalText[(state.profile || {}).goal] || '오르막 구간에서 일정한 페이스 유지';
    return {
      distance: course.distance,
      duration: course.duration,
      level: course.level,
      mainGoal: baseGoal,
      water: course.water,
      waterReminder: '수분 섭취: 40~60분 간격 확인',
      paceTarget: s.hasData && s.avgPace ? s.avgPace : null,
      note: s.hasData
        ? `지난 산행 평균 페이스 ${fmtPace(s.avgPace)}를 기준으로 잡았습니다.`
        : '아직 기준 페이스 데이터가 없어 완만한 출발을 권장합니다.'
    };
  }

  /* --------------------------- utils --------------------------- */
  function fmtDur(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }
  function fmtDurClock(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s2 = Math.floor(sec % 60);
    return [h, m, s2].map((n) => String(n).padStart(2, '0')).join(':');
  }
  function fmtPace(minPerKm) {
    if (!minPerKm) return '—';
    const m = Math.floor(minPerKm);
    const sec = Math.round((minPerKm - m) * 60);
    return `${m}'${String(sec).padStart(2, '0')}" /km`;
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmtRelative(ts) {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days <= 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  }

  /* --------------------- 데모 시드 (상태 체험용) --------------------- */
  /**
   * seedDemo('growing' | 'personalized')
   * 실제 서비스처럼 보이는 샘플 기록을 생성합니다.
   * 이 기록들은 정상 records 로 저장되므로 모든 통계/AI분석/추천이 실제처럼 계산됩니다.
   */
  function seedDemo(kind) {
    const DAY = 86400000;
    const now = Date.now();

    const planWeeks = { 'week': 0.4, '2-3w': 2.5, 'month': 4, 'unknown': 3 };
    const gapDays = kind === 'personalized' ? 23 : 21;

    /* 개인화용 프로필 (없을 때만) */
    if (!state.profile) {
      state.profile = {
        name: '김산행', age: 38, weight: 70, height: 174, gender: 'none', wearable: 'apple',
        experience: kind === 'personalized' ? 'casual' : 'casual',
        preference: kind === 'personalized' ? 'moderate' : 'moderate',
        goal: 'fitness', plan: '2-3w'
      };
      state.ui.onboardedAt = now;
    }

    const pickFrom = ['gyeryong-donghaksa', 'gwanak-seouluniv', 'cheonggye-otgol', 'soyo', 'surak', 'gyeryong-donghaksa'];
    const count = kind === 'personalized' ? 6 : 2;
    const records = [];

    for (let i = 0; i < count; i++) {
      const c = HHC.COURSES.find((x) => x.id === pickFrom[i % pickFrom.length]);
      /* 최근 회차일수록 성장 (거리/고도 증가) */
      const growth = kind === 'personalized' ? (1 + (count - i) * 0.035) : 1;
      const dist = Number((c.distance * growth * 0.96).toFixed(2));
      const ascent = Math.round(c.ascent * growth);
      const dur = Math.round(c.duration * 60 * (0.95 + (i % 3) * 0.04));
      const gap = gapDays + (i % 3) * 3;
      records.push({
        id: 'demo_' + i + '_' + Math.random().toString(36).slice(2, 6),
        date: now - gap * DAY * (i + 1) + DAY,
        courseId: c.id,
        name: c.name,
        distance: dist,
        duration: dur,
        ascent: ascent,
        descent: Math.round(ascent * 0.94),
        avgPace: Number(((dur / 60) / dist).toFixed(2)),
        calories: Math.round(c.calories * (dist / c.distance)),
        level: c.level,
        maxAlt: Math.max.apply(null, c.elevation),
        paceStability: 70 + i * 4,
        elevation: c.elevation,
        splits: [{ km: 1, pace: (dur / 60) / dist }, { km: dist, pace: (dur / 60) / dist * 1.1 }]
      });
    }
    state.records = records.sort((a, b) => b.date - a.date);
    persist(); emit();
    return state;
  }

  /* expose */
  window.HHC.store = {
    subscribe, get, saveProfile, addRecord, deleteRecord, resetAll,
    setPref, setUi, getStats, buildAnalysis, recommendNext, buildGoalPlan, seedDemo,
    utils: { fmtDur, fmtDurClock, fmtPace, fmtDate, fmtRelative }
  };
})();
