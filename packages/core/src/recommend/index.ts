/* ==========================================================================
   RECOMMEND — 다음 산행 추천 엔진 / 이번 산행 목표
   js/store.js:278-433 에서 이동. 스코어링 계수와 문구는 변경하지 않았다.

   변경점은 시그니처뿐:
     before  recommendNext()                  // state / HHC.COURSES / HHC.WEATHER 전역 참조
     after   recommendNext({ records, profile, courses, weather, now })

   ISSUE-005: reasons / reasonText 가 한국어 + <strong> 태그를 포함한다.
   ISSUE-010: 스코어 계수(26 / 30 / 12 / 26 / ±0.5 / 1.08 / 0.92 …)가
              코드에 하드코딩되어 튜닝할 수 없다.
   ========================================================================== */
import type {
  Course, GoalPlan, HikeRecord, LevelValue, Profile,
  Recommendation, RecommendationBasis, Stats, Weather
} from '../types';
import { hasStatsData } from '../types';
import { clampLevel } from '../levels';
import { getStats } from '../stats';
import { ONBOARDING, optionTitle } from '../catalog/onboarding';
import { fmtPace } from '../format';

export interface RecommendInput {
  records: HikeRecord[];
  profile: Profile | null;
  courses: Course[];
  weather: Weather;
  now?: number;
}

export function recommendNext(input: RecommendInput): Recommendation {
  const { records, courses, weather: w } = input;
  const now = input.now ?? Date.now();
  const profile: Profile = input.profile || {};
  const s = getStats(records, now);

  /* ---- 1) 목표 난이도 / 거리 결정 ---- */
  let targetLevel: LevelValue;
  let targetDistance: number;
  let basis: RecommendationBasis;
  const reasons: string[] = [];

  if (!hasStatsData(s)) {
    /* 신규 사용자 — 입력 정보 기반 (기록 없음) */
    const prefToLevel: Record<string, number> = { light: 1, moderate: 2, challenge: 3 };
    const expToLevel: Record<string, number> = { new: 1, casual: 2, regular: 3 };
    targetLevel = clampLevel(
      ((prefToLevel[profile.preference as string] || 2) + (expToLevel[profile.experience as string] || 1)) / 2
    );
    const levelDist: Record<number, number> = { 1: 4.5, 2: 6.8, 3: 8.5, 4: 11 };
    targetDistance = levelDist[targetLevel] || 6.5;
    basis = 'basic';
    reasons.push(`등산 경험은 <strong>${optionTitle(ONBOARDING.experience, profile.experience, '입력 정보')}</strong> 수준입니다.`);
    reasons.push(`선호 난이도(<strong>${optionTitle(ONBOARDING.preference, profile.preference, '미입력')}</strong>)에 맞춰 첫 산행 부담을 낮췄습니다.`);
    reasons.push('아직 산행 기록이 없어 <strong>입력 정보 + 코스 데이터 + 날씨</strong>만으로 추천했습니다.');
  } else {
    /* 기존 사용자 — 실제 기록 기반 */
    const avgLevel = s.avgLevel;
    const gap = s.avgGap;

    let adj = 0;
    if (s.trendDirection === 'up') adj += 0.5;
    if (s.trendDirection === 'down') adj -= 0.5;
    if (gap !== null && s.daysSinceLast > gap * 1.6) adj -= 0.5;
    if (gap !== null && gap <= 12 && s.trendDirection === 'up') adj += 0.25;
    if (s.count === 1) adj = 0;

    targetLevel = clampLevel(avgLevel + adj);
    targetDistance = s.avgDistance * (s.count === 1 ? 1.02 : adj > 0 ? 1.08 : adj < 0 ? 0.92 : 1.01);
    basis = s.hasEnoughData ? 'personalized' : 'partial';

    reasons.push(`최근 ${s.count}회 평균 거리 <strong>${s.avgDistance.toFixed(1)}km</strong>, 평균 고도 상승 <strong>+${Math.round(s.avgAscent)}m</strong>를 기준으로 했습니다.`);

    if (gap !== null) {
      if (s.daysSinceLast > gap * 1.6) {
        reasons.push(`최근 산행 간격 <strong>${Math.round(s.daysSinceLast)}일</strong>로 평소 주기(${gap.toFixed(0)}일)보다 길어 <strong>이전보다 낮은 난이도</strong>를 추천합니다.`);
      } else if (s.trendDirection === 'up') {
        reasons.push('최근 산행에서 거리와 고도 상승량이 꾸준히 증가해 <strong>지난 산행보다 약 10% 높은 난이도</strong>의 코스를 추천합니다.');
      } else if (s.trendDirection === 'down') {
        reasons.push('최근 기록이 다소 낮아져 <strong>회복 중심</strong>으로 코스를 구성했습니다.');
      } else {
        reasons.push(`평소 산행 주기(<strong>${gap.toFixed(0)}일</strong>)를 고려해 무리하지 않고 이전과 비슷한 난이도를 추천합니다.`);
      }
    }
  }

  /* ---- 2) 날씨 보정 ---- */
  if (w.rain >= 50) {
    targetLevel = clampLevel(targetLevel - 1);
    reasons.push(`예정일 강수 확률이 <strong>${w.rain}%</strong>로 높아 안전을 위해 난이도를 낮췄습니다.`);
  } else if (w.tempMax <= 12) {
    reasons.push(`예정일 최고 기온이 <strong>${w.tempMax}°C</strong>로 낮아 코스 길이를 감안한 보온 준비가 필요합니다.`);
  } else {
    reasons.push(`예정일 날씨는 <strong>${w.condition} · ${w.tempMin}~${w.tempMax}°C</strong>로 산행에 적합합니다.`);
  }

  /* ---- 3) 코스 스코어링 ---- */
  const scored = courses
    .map((c) => {
      const diffLevel = Math.abs(c.level - targetLevel);
      const diffDist = targetDistance ? Math.abs(c.distance - targetDistance) / Math.max(targetDistance, 1) : 0;
      let score = 100 - diffLevel * 26 - diffDist * 30;

      /* 이미 다녀온 코스는 감점 (새로움) */
      const times = hasStatsData(s) ? s.records.filter((r) => r.courseId === c.id).length : 0;
      if (times === 1) score -= 12;
      if (times >= 2) score -= 26;

      /* 목표 반영 */
      const goal = profile.goal;
      if (goal === 'fitness' && c.ascent > 450) score += 5;
      if (goal === 'stress' && c.tags.includes('숲길')) score += 5;
      if (goal === 'newcourse') score += 2;
      if (goal === 'light' && c.level === 1) score += 5;
      if (profile.preference === 'challenge' && c.level >= 3) score += 4;
      if (profile.preference === 'light' && c.level === 1) score += 5;

      return { course: c, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3).map((entry, i) => ({
    ...entry.course,
    rank: i + 1,
    matched: entry.score,
    reasonText: pickReason(entry.course, { stats: s, profile, basis })
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

/* 코스별 한 줄 추천 이유.
   stats 를 주입받아 코스마다 통계를 재계산하지 않는다 (원본과 동일한 동작). */
export function pickReason(
  _course: Course,
  ctx: { stats: Stats; profile: Profile; basis: RecommendationBasis }
): string {
  const { profile, basis, stats: s } = ctx;

  if (basis === 'basic') {
    const exp = optionTitle(ONBOARDING.experience, profile.experience, '입력하신');
    const pref = optionTitle(ONBOARDING.preference, profile.preference, '선호도');
    return `${exp} 사용자이며 ${pref}를 선호하는 점을 고려해 처음 도전하기 좋은 코스로 추천했습니다.`;
  }
  if (!hasStatsData(s)) {
    /* basis 가 basic 이 아니면 기록이 있다는 뜻이므로 실제로는 도달하지 않는다 */
    return '현재 체력 수준에 적합한 코스입니다.';
  }
  if (s.count === 1) {
    return `첫 산행 기록(${s.last.distance.toFixed(1)}km · +${Math.round(s.last.ascent)}m)을 기준선으로 삼아 비슷한 체력 부담의 코스를 추천했습니다.`;
  }
  if (s.trendDirection === 'up') {
    return '최근 산행 거리와 고도 상승량을 고려했을 때 현재 체력 수준에서 한 단계 도전해 볼 수 있는 코스입니다.';
  }
  if (s.trendDirection === 'down') {
    return '최근 기록을 반영해 무리 없이 회복할 수 있는 난이도의 코스입니다.';
  }
  return `최근 산행 거리(${s.avgDistance.toFixed(1)}km)와 고도 상승량(+${Math.round(s.avgAscent)}m)을 고려했을 때 현재 체력 수준에 적합한 코스입니다.`;
}

/* --------------------- 이번 산행 목표 카드 --------------------- */
export interface GoalPlanInput {
  records: HikeRecord[];
  profile: Profile | null;
  now?: number;
}

export function buildGoalPlan(course: Course, input: GoalPlanInput): GoalPlan {
  const s = getStats(input.records, input.now ?? Date.now());
  const profile: Profile = input.profile || {};

  const goalText: Record<string, string> = {
    fitness: '오르막 구간에서 일정한 페이스 유지',
    health: '무리 없는 심박 구간 유지',
    stress: '호흡을 정리하며 경치 감상 구간 확보',
    newcourse: '새 코스 경로 파악 · 이탈 방지',
    light: '천천히 완주 · 컨디션 확인'
  };
  const baseGoal = goalText[profile.goal as string] || '오르막 구간에서 일정한 페이스 유지';
  const avgPace = hasStatsData(s) ? s.avgPace : 0;

  return {
    distance: course.distance,
    duration: course.duration,
    level: course.level,
    mainGoal: baseGoal,
    water: course.water,
    waterReminder: '수분 섭취: 40~60분 간격 확인',
    paceTarget: s.hasData && avgPace ? avgPace : null,
    note: s.hasData
      ? `지난 산행 평균 페이스 ${fmtPace(avgPace)}를 기준으로 잡았습니다.`
      : '아직 기준 페이스 데이터가 없어 완만한 출발을 권장합니다.'
  };
}
