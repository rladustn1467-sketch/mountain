/* ==========================================================================
   SCREENS — 산행 세션
     hiking-setup → hiking-live → hike-result → analysis
   Start / Pause / Resume / Finish 상태 변화가 실제로 동작하며,
   종료 시 기록이 store 에 추가되어 통계 · AI 분석 · 다음 추천이 갱신됩니다.
   ========================================================================== */
(function () {
  const { ui, router, store } = HHC;
  const U = store.utils;

  /* ------------------------------------------------------------------
     세션 상태 (모듈 스코프 — 탭을 벗어나도 유지)
     ------------------------------------------------------------------ */
  const session = {
    active: false,
    paused: false,
    courseId: null,
    course: null,
    startedAt: null,
    elapsed: 0,          // 누적 경과(초)
    distance: 0,         // km
    ascent: 0,           // m
    altitude: 0,
    maxAlt: 0,
    progress: 0,         // 0~100
    splits: [],          // 구간 페이스
    tick: null
  };

  /* 직전에 저장된 기록 id — hike-result 가 파라미터 없이 진입할 때의 폴백 */
  let lastRecordId = null;

  function courseFromId(id) {
    return HHC.COURSES.find((c) => c.id === id) || HHC.COURSES[0];
  }
  function startSession(courseId) {
    const c = courseFromId(courseId);
    session.active = true; session.paused = false;
    session.courseId = c.id; session.course = c;
    session.startedAt = Date.now();
    session.elapsed = 0; session.distance = 0; session.ascent = 0;
    session.progress = 0; session.splits = [];
    session.altitude = c.elevation[0];
    session.maxAlt = c.elevation[0];
    session.tick = setInterval(tick, 1000);
  }
  function stopTimer() { if (session.tick) { clearInterval(session.tick); session.tick = null; } }

  /* 1초마다 진행 시뮬레이션 (프로토타입이지만 물리적으로 그럴듯하게) */
  function tick() {
    if (!session.active || session.paused) return;
    const c = session.course;
    session.elapsed++;

    /* 총 예상 시간 대비 진행률 */
    const totalSec = c.duration * 60;
    const p = Math.min(100, (session.elapsed / totalSec) * 100);
    session.progress = p;

    /* 거리 : 완만한 가속 → 안정 */
    const target = c.distance;
    session.distance = Math.min(target, (p / 100) * target * (1 + Math.sin(p / 22) * 0.012));

    /* 고도 : 코스 elevation 프로파일 따라 보간 */
    const idx = (p / 100) * (c.elevation.length - 1);
    const lo = Math.floor(idx), hi = Math.min(c.elevation.length - 1, lo + 1);
    const frac = idx - lo;
    session.altitude = Math.round(c.elevation[lo] + (c.elevation[hi] - c.elevation[lo]) * frac);
    session.maxAlt = Math.max(session.maxAlt, session.altitude);
    session.ascent = Math.round((p / 100) * c.ascent * (0.92 + Math.cos(p / 30) * 0.05));

    /* 5분마다 구간 페이스 기록 */
    if (session.elapsed % 300 === 0) {
      const pace = currentPace();
      session.splits.push({ km: (session.splits.length + 1) * (c.distance / Math.ceil(totalSec / 300)), pace: pace });
    }

    /* 라이브 화면이 떠 있으면 부분 렌더 */
    if (router.getCurrent().name === 'hiking-live') {
      const el = document.getElementById('view');
      const host = el && el.querySelector('[data-live]');
      if (host) host.innerHTML = liveBody();
    }
  }

  function currentPace() {
    if (session.distance < 0.05) return 0;
    return (session.elapsed / 60) / session.distance;
  }

  /* ------------------------------------------------------------------
     1. 산행 시작 (setup)
     ------------------------------------------------------------------ */
  router.register('hiking-setup', {
    render(params) {
      const course = courseFromId(params.course || (session.courseId || HHC.COURSES[0].id));
      const goal = store.buildGoalPlan(course);
      const stats = store.getStats();
      const w = HHC.WEATHER;
      return `<section class="screen">
        <header class="topbar topbar--line">
          <button class="icon-btn" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="topbar__title">산행 시작</span>
        </header>
        <div class="screen__body screen__body--notitle">
          <div class="hero" style="min-height:190px">
            <img class="hero__img" src="${HHC.IMAGES[course.image]}" alt="${HHC.esc(course.region)}">
            <div class="hero__eyebrow">오늘의 산행</div>
            <h1 class="hero__title" style="font-size:var(--fs-xl)">${HHC.esc(course.name)}</h1>
            <div class="hero__metrics">
              <div class="hero__metric"><b class="num">${course.distance.toFixed(1)}</b><span>km 거리</span></div>
              <div class="hero__metric"><b>${U.fmtDur(course.duration * 60)}</b><span>예상 시간</span></div>
              <div class="hero__metric"><b class="num">+${course.ascent}</b><span>고도 상승</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-clipboard-check"></i> 산행 전 체크</h2>
                <p class="card__sub">${w.condition} · ${w.tempMin}~${w.tempMax}°C · 강수 ${w.rain}%</p></div>
            </div>
            <div class="stack-2">
              <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-bottle-water" style="color:var(--color-secondary-500)"></i> 물 준비</span><strong>${HHC.esc(course.water)}</strong></div>
              <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-gauge-high" style="color:var(--color-secondary-500)"></i> 주요 목표</span><strong style="font-size:var(--fs-sm);text-align:right">${HHC.esc(goal.mainGoal)}</strong></div>
              <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-person-walking" style="color:var(--color-secondary-500)"></i> 기준 페이스</span><strong>${goal.paceTarget ? U.fmtPace(goal.paceTarget) : '첫 산행 · 자유 페이스'}</strong></div>
            </div>
            ${!stats.hasData ? ui.notice('첫 산행입니다. GPS와 심박은 프로토타입 시뮬레이션으로 동작합니다.', 'muted', 'fa-flask') : ''}
          </div>

          ${ui.notice('산행을 시작하면 <strong>실시간 GPS · 페이스 코칭 · 안전 알림</strong>이 동작합니다 (프로토타입).', '', 'fa-satellite-dish')}

          <button class="btn btn--primary btn--lg btn--block" data-nav="start" data-course="${course.id}">
            <i class="fa-solid fa-play"></i> Start Hiking
          </button>
          <button class="btn btn--ghost btn--block" data-nav="back">나중에 하기</button>
        </div>
      </section>`;
    },
    mount(el) {
      el.querySelector('[data-nav="start"]').addEventListener('click', (e) => {
        startSession(e.currentTarget.dataset.course);
        router.go('hiking-live');
        HHC.toast('산행을 시작했습니다. 안전한 산행 되세요!', 'fa-person-hiking');
      });
    }
  });

  /* ------------------------------------------------------------------
     2. 산행 진행 (live)
     ------------------------------------------------------------------ */
  function liveBody() {
    const c = session.course;
    const pace = currentPace();
    const remainKm = Math.max(0, c.distance - session.distance);
    const remainSec = Math.max(0, c.duration * 60 - session.elapsed);
    const statusText = session.paused ? '일시정지' : '기록 중';

    /* 구간 페이스 (시뮬레이션) */
    const splits = session.splits.length ? session.splits : [{ km: 1, pace: pace || 0 }];
    const maxPace = Math.max.apply(null, splits.map((s) => s.pace).concat([1]));

    return `<div class="stack-4">
      <div class="hike-top">
        <span class="live-dot ${session.paused ? 'live-dot--paused' : ''}">${statusText}</span>
        <span class="text-faint" style="font-size:var(--fs-xs)">${HHC.esc(c.name)}</span>
      </div>

      <div class="hike-hero-metrics">
        <div class="hike-metric hike-metric--primary" style="grid-column:span 2">
          <div class="hike-metric__label"><i class="fa-solid fa-route"></i>현재 거리</div>
          <div class="hike-metric__value num">${session.distance.toFixed(2)}<small>km</small></div>
          <div class="hike-metric__sub">예상 남은 거리 ${remainKm.toFixed(1)} km</div>
        </div>
        <div class="hike-metric">
          <div class="hike-metric__label"><i class="fa-solid fa-stopwatch"></i>경과 시간</div>
          <div class="hike-metric__value num">${U.fmtDurClock(session.elapsed)}</div>
          <div class="hike-metric__sub">남은 예상 ${U.fmtDur(remainSec)}</div>
        </div>
        <div class="hike-metric">
          <div class="hike-metric__label"><i class="fa-solid fa-gauge-high"></i>현재 페이스</div>
          <div class="hike-metric__value num" style="font-size:var(--fs-lg)">${pace ? U.fmtPace(pace) : '—'}</div>
          <div class="hike-metric__sub">${pace && store.getStats().avgPace ? (pace < store.getStats().avgPace ? '평균보다 빠름' : '평균보다 느림') : '측정 중'}</div>
        </div>
        <div class="hike-metric">
          <div class="hike-metric__label"><i class="fa-solid fa-mountain"></i>현재 고도</div>
          <div class="hike-metric__value num">${session.altitude}<small>m</small></div>
          <div class="hike-metric__sub">최고 ${session.maxAlt} m</div>
        </div>
        <div class="hike-metric">
          <div class="hike-metric__label"><i class="fa-solid fa-arrow-up"></i>상승 고도</div>
          <div class="hike-metric__value num">+${session.ascent}<small>m</small></div>
          <div class="hike-metric__sub">목표 +${c.ascent} m</div>
        </div>
      </div>

      <div class="card card--flat">
        <div class="between" style="margin-bottom:var(--sp-3)">
          <span style="font-size:var(--fs-sm);font-weight:var(--fw-semibold)">GPS 경로</span>
          <span class="chip chip--sm"><i class="fa-solid fa-satellite-dish"></i>시뮬레이션</span>
        </div>
        <div class="map-canvas">${HHC.charts.trailMap(session.progress)}</div>
        <div class="bar-meta"><span>진행률 ${session.progress.toFixed(0)}%</span><span>${c.distance.toFixed(1)} km 코스</span></div>
        <div class="bar bar--thin"><span style="width:${session.progress}%"></span></div>
      </div>

      <div class="card card--flat">
        <div class="between" style="margin-bottom:var(--sp-3)">
          <span style="font-size:var(--fs-sm);font-weight:var(--fw-semibold)">구간 페이스</span>
          <span class="text-faint" style="font-size:var(--fs-2xs)">5분 단위</span>
        </div>
        <div class="pace-splits">
          ${splits.map((s) => `<div class="split-row">
            <span class="split-row__label">구간 ${s.km.toFixed(1)}km</span>
            <span class="split-row__bar"><span style="width:${maxPace ? (s.pace / maxPace) * 100 : 0}%"></span></span>
            <span class="split-row__val num">${U.fmtPace(s.pace)}</span>
          </div>`).join('')}
        </div>
      </div>

      ${session.progress > 70 ? `<div class="notice notice--warn"><i class="fa-solid fa-triangle-exclamation"></i>
        <span>코스 후반부입니다. 하산 구간에서 <strong>무릎 부담</strong>이 커질 수 있으니 페이스를 낮춰주세요.</span></div>` : ''}

      <div class="hike-controls">
        <button class="ctrl-btn ctrl-btn--side" data-nav="finish" aria-label="산행 종료">
          <i class="fa-solid fa-flag-checkered"></i><span>종료</span>
        </button>
        <button class="ctrl-btn ctrl-btn--big btn ${session.paused ? 'btn--primary' : 'btn--outline'}" data-nav="pause">
          <i class="fa-solid ${session.paused ? 'fa-play' : 'fa-pause'}"></i>
          ${session.paused ? '이어서 산행' : '일시정지'}
        </button>
        <button class="ctrl-btn ctrl-btn--side" data-nav="sos" aria-label="SOS 안전 알림">
          <i class="fa-solid fa-tower-broadcast"></i><span>안전</span>
        </button>
      </div>
    </div>`;
  }

  router.register('hiking-live', {
    render() {
      if (!session.active) {
        return `<section class="screen"><div class="screen__body screen__body--notitle">
          ${ui.empty('진행 중인 산행이 없습니다', '코스를 선택해 산행을 시작하면 실시간 기록이 여기에 표시됩니다.',
            `<button class="btn btn--primary" data-go="recommend">산행 코스 추천받기</button>`)}
        </div></section>`;
      }
      return `<section class="screen">
        <header class="topbar topbar--line">
          <span class="topbar__title">산행 진행</span>
          <span class="chip chip--sm ${session.paused ? '' : 'chip--active'}">${session.paused ? '일시정지' : 'LIVE'}</span>
        </header>
        <div class="screen__body screen__body--notitle" data-live>${liveBody()}</div>
      </section>`;
    },
    mount(el) {
      /* 이벤트 위임 */
      el.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-nav]');
        if (!btn) return;
        const action = btn.dataset.nav;
        if (action === 'pause') {
          session.paused = !session.paused;
          HHC.toast(session.paused ? '산행을 일시정지했습니다' : '산행을 재개했습니다',
            session.paused ? 'fa-pause' : 'fa-play');
          const host = el.querySelector('[data-live]');
          if (host) host.innerHTML = liveBody();
          const chip = el.querySelector('.topbar .chip');
          if (chip) { chip.textContent = session.paused ? '일시정지' : 'LIVE'; chip.classList.toggle('chip--active', !session.paused); }
        } else if (action === 'finish') {
          openFinishSheet(el);
        } else if (action === 'sos') {
          HHC.toast('안전 알림을 전송했습니다 (프로토타입)', 'fa-tower-broadcast');
        }
      });
    }
  });

  /* 종료 확인 시트 */
  function openFinishSheet(el) {
    const sheet = document.createElement('div');
    sheet.className = 'sheet-backdrop';
    sheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="산행 종료 확인">
      <div class="sheet__grip"></div>
      <h2 class="sheet__title">산행을 종료할까요?</h2>
      <div class="card card--inset">
        <div class="stat-grid stat-grid--3">
          ${ui.stat('거리', session.distance.toFixed(2), 'km')}
          ${ui.stat('경과 시간', U.fmtDur(session.elapsed), '')}
          ${ui.stat('상승 고도', '+' + session.ascent, 'm')}
        </div>
      </div>
      <p class="text-muted" style="font-size:var(--fs-sm);margin-top:var(--sp-3)">
        종료하면 AI가 이번 산행을 분석하고 <strong>다음 추천에 반영</strong>합니다.
      </p>
      <div class="sheet__actions">
        <button class="btn btn--ghost" data-sheet="cancel">계속 산행</button>
        <button class="btn btn--primary" data-sheet="confirm">Finish Hiking</button>
      </div>
    </div>`;
    el.appendChild(sheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) sheet.remove();
      const btn = e.target.closest('[data-sheet]');
      if (!btn) return;
      if (btn.dataset.sheet === 'cancel') sheet.remove();
      else { sheet.remove(); finishSession(); }
    });
  }

  /* 세션 종료 → 기록 저장 → 결과 화면 */
  function finishSession() {
    stopTimer();
    const c = session.course;
    const stats = store.getStats();

    /* 페이스 안정성 계산: 평균 페이스 대비 편차 (시뮬레이션 값) */
    const pace = currentPace();
    const stability = Math.min(98, Math.max(58, 74 + Math.round(Math.random() * 20)));

    const rec = store.addRecord({
      courseId: c.id,
      name: c.name,
      distance: Number(session.distance.toFixed(2)),
      duration: session.elapsed,
      ascent: session.ascent,
      descent: Math.round(session.ascent * 0.94),
      avgPace: Number(pace.toFixed(2)),
      calories: Math.round(c.calories * (session.distance / c.distance) * (session.elapsed / (c.duration * 60))),
      level: c.level,
      maxAlt: session.maxAlt,
      paceStability: stability,
      elevation: c.elevation,
      splits: session.splits
    });

    const wasNew = !stats.hasData;
    session.active = false;
    session.paused = false;
    lastRecordId = rec.id;

    router.replace('hike-result', { record: rec.id, first: wasNew ? '1' : '' });
    HHC.toast(wasNew ? '첫 산행 기록이 저장되었습니다!' : '산행 기록이 저장되었습니다', 'fa-circle-check');
  }

  /* ------------------------------------------------------------------
     3. 산행 결과
     ------------------------------------------------------------------ */
  function getRecord(id) {
    return store.get().records.find((r) => r.id === id) || store.get().records[0];
  }

  router.register('hike-result', {
    render(params) {
      if (!store.get().records.length) {
        return `<section class="screen"><div class="screen__body">${ui.empty('산행 기록이 없습니다', '산행을 완료하면 결과가 여기에 표시됩니다.',
          `<button class="btn btn--primary" data-go="hiking">산행 시작</button>`)}</div></section>`;
      }
      const rec = getRecord(params.record || lastRecordId);
      const stats = store.getStats();
      const prev = stats.records[stats.records.findIndex((r) => r.id === rec.id) + 1] || null;
      const dDelta = prev ? ((rec.distance - prev.distance) / prev.distance) * 100 : 0;
      const aDelta = prev ? ((rec.ascent - prev.ascent) / prev.ascent) * 100 : 0;
      const isFirst = !prev;

      return `<section class="screen">
        <header class="topbar">
          <span class="topbar__title">${isFirst ? '첫 산행 결과' : '이번 산행 결과'}</span>
          <button class="icon-btn" data-go="home" aria-label="홈으로"><i class="fa-solid fa-house"></i></button>
        </header>
        <div class="screen__body screen__body--notitle">
          <div class="result-hero">
            <div class="hero__eyebrow">${U.fmtDate(rec.date)} · ${HHC.esc(rec.name)}</div>
            <h1 class="hero__title" style="font-size:var(--fs-xl)">${isFirst ? '첫 산행을 완료했어요!' : '이번 산행을 완료했습니다'}</h1>
            <div class="result-stats">
              <div class="result-stat"><b class="num">${rec.distance.toFixed(1)}</b><span>km</span></div>
              <div class="result-stat"><b>${U.fmtDur(rec.duration)}</b><span>시간</span></div>
              <div class="result-stat"><b class="num">+${rec.ascent}</b><span>고도(m)</span></div>
            </div>
          </div>

          <div class="card">
            <div class="stat-grid stat-grid--3">
              ${ui.stat('평균 페이스', rec.avgPace ? U.fmtPace(rec.avgPace) : '—', '')}
              ${ui.stat('최고 고도', rec.maxAlt || '—', rec.maxAlt ? 'm' : '')}
              ${ui.stat('칼로리', rec.calories || '—', rec.calories ? 'kcal' : '')}
            </div>
          </div>

          ${prev ? `<div class="card card--alt">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-arrow-right-arrow-left"></i> 지난 산행과 비교</h2>
              <p class="card__sub">지난 산행 ${U.fmtRelative(prev.date)} · ${prev.distance.toFixed(1)} km</p></div>
            </div>
            <div class="stack-3">
              <div class="between"><span style="font-size:var(--fs-sm)">거리</span>${ui.delta(dDelta, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">고도 상승</span>${ui.delta(aDelta, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">페이스 안정성</span>
                <span class="stat__delta delta-up"><i class="fa-solid fa-wave-square"></i>${rec.paceStability}/100</span></div>
            </div>
          </div>` : ui.notice('첫 산행이므로 비교 대상이 없습니다. 이번 기록이 <strong>기준선(baseline)</strong>으로 저장되었습니다.', 'muted', 'fa-ruler')}

          <div class="card card--flat">
            <div class="card__head" style="margin-bottom:var(--sp-2)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-chart-area"></i> 고도 프로필</h2></div>
            </div>
            ${HHC.charts.elevation(rec.elevation || session.course.elevation)}
          </div>

          <div class="btn-row">
            <button class="btn btn--outline" data-go="records">기록 보기</button>
            <button class="btn btn--primary" data-go="analysis" data-record="${rec.id}">
              <i class="fa-solid fa-wand-magic-sparkles"></i> AI 분석 보기
            </button>
          </div>
        </div>
      </section>`;
    }
  });

  /* ------------------------------------------------------------------
     4. AI 산행 분석
     ------------------------------------------------------------------ */
  router.register('analysis', {
    render(params) {
      const stats = store.getStats();
      const analysis = store.buildAnalysis();
      const rec = params && params.record ? getRecord(params.record) : stats.last;

      if (!stats.hasData) {
        return `<section class="screen">
          <header class="topbar topbar--line">
            <button class="icon-btn" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
            <span class="topbar__title">AI 산행 분석</span>
          </header>
          <div class="screen__body screen__body--notitle">
            ${ui.empty('분석할 데이터가 없습니다', '산행을 완료하면 AI가 기록을 분석해 개선점을 알려드립니다.',
              `<button class="btn btn--primary" data-go="recommend">첫 산행 추천받기</button>`)}
          </div>
        </section>`;
      }

      /* 난이도 변화 제안 */
      const rec2 = store.recommendNext();
      const curLevel = rec.level || 2;
      const nextLevel = rec2.targetLevel;
      const levelDiff = nextLevel - curLevel;
      const nextSuggestion = levelDiff > 0
        ? `다음 산행에서는 약 <strong>${Math.abs(levelDiff)}단계 높은</strong> 난이도(${(HHC.LEVELS[nextLevel] || {}).label})에 도전할 수 있습니다.`
        : levelDiff < 0
          ? `다음 산행은 <strong>${Math.abs(levelDiff)}단계 낮은</strong> 난이도(${(HHC.LEVELS[nextLevel] || {}).label})로 회복하는 것을 권장합니다.`
          : `다음 산행에서는 <strong>현재 난이도를 유지</strong>하거나 거리·고도를 조금 늘려볼 수 있습니다.`;

      return `<section class="screen">
        <header class="topbar topbar--line">
          <button class="icon-btn" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="topbar__title">AI 산행 분석</span>
        </header>
        <div class="screen__body screen__body--notitle">
          <div class="card card--ai">
            <div class="card__head">
              <div>
                <span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>${stats.stage === 'personalized' ? '개인화 분석' : stats.stage === 'growing' ? '기본 분석' : '기준선 분석'}</span>
                <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-lg)">${analysis.headline}</h2>
                <p class="card__sub">${stats.count}회 산행 · ${U.fmtDate(rec.date)} 기준</p>
              </div>
            </div>
            <div class="confidence">
              <div class="grow"><div class="confidence__label" style="margin-bottom:5px">분석 신뢰도 ${analysis.confidence}%</div>
                <div class="bar"><span style="width:${analysis.confidence}%"></span></div></div>
            </div>
            <div style="margin-top:var(--sp-4)">${ui.aiPoints(analysis.points)}</div>
          </div>

          <!-- 난이도 변화 / 다음 제안 -->
          <section class="card">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-arrow-up-right-dots"></i> 다음 난이도 제안</h2>
                <p class="card__sub">현재 난이도 → 추천 난이도</p></div>
            </div>
            <div class="inline" style="gap:var(--sp-4);justify-content:center;padding:var(--sp-3) 0">
              ${ui.levelChip(curLevel)}
              <i class="fa-solid fa-arrow-right-long" style="color:var(--color-text-faint)"></i>
              ${ui.levelChip(nextLevel)}
            </div>
            <p style="font-size:var(--fs-sm);color:var(--color-text-muted);line-height:var(--lh-normal);text-align:center">
              ${nextSuggestion}
            </p>
            <button class="btn btn--primary btn--block" style="margin-top:var(--sp-4)" data-go="recommend">
              <i class="fa-solid fa-wand-magic-sparkles"></i> 다음 산행 추천받기
            </button>
          </section>

          <!-- 장기 개선점 -->
          ${stats.hasEnoughData ? `<section class="card card--alt">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-chart-line"></i> 장기 개선점</h2>
                <p class="card__sub">최근 ${Math.ceil(stats.count / 2)}회 vs 이전 ${Math.floor(stats.count / 2)}회</p></div>
            </div>
            <div class="stack-3">
              <div class="between"><span style="font-size:var(--fs-sm)">평균 거리</span>${ui.delta(stats.distanceTrend, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">평균 고도 상승</span>${ui.delta(stats.ascentTrend, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">오르막 페이스 안정성</span>${ui.delta(stats.stabilityTrend, '%', true)}</div>
            </div>
            <div style="margin-top:var(--sp-4)">${HHC.charts.sparkline(stats.series.map((r) => r.ascent), { height: 60 })}</div>
            <div class="bar-meta"><span>회차별 고도 상승 추세</span><span>+${Math.round(stats.avgAscent)}m 평균</span></div>
          </section>` : ui.notice('3회 이상 산행하면 <strong>장기 개선점 분석</strong>이 활성화됩니다.', 'muted', 'fa-database')}

          <!-- 데이터가 다음 추천에 반영 -->
          <div class="card card--inset">
            <div class="inline" style="gap:var(--sp-3);align-items:flex-start">
              <i class="fa-solid fa-arrows-spin" style="color:var(--color-primary);margin-top:3px"></i>
              <div><div style="font-weight:var(--fw-semibold);font-size:var(--fs-sm)">이 분석이 다음 추천에 반영되었습니다</div>
                <p class="text-muted" style="font-size:var(--fs-xs);margin-top:3px">
                  현재까지 ${stats.count}회 기록이 저장되었고, 다음 추천은 이 데이터를 기준으로 계산됩니다.
                </p></div>
            </div>
          </div>

          <button class="btn btn--outline btn--block" data-go="records"><i class="fa-solid fa-chart-simple"></i> 나의 산행 기록 전체 보기</button>
        </div>
      </section>`;
    }
  });

  /* 라우트 변경 시 타이머 정리 (세션은 유지) */
  HHC.screens = HHC.screens || {};
  HHC.screens.onRouteChangeRoute = null;
  HHC.screens.hikingSession = session;
  HHC.stopHikeTimer = stopTimer;

  /* 검증/데모용 : 외부에서 세션 시작 · 종료 */
  HHC.startHike = function (courseId) { startSession(courseId || HHC.COURSES[0].id); };
  HHC.finishHike = function () { if (session.active) finishSession(); };
  HHC.hikeTick = tick;
})();
