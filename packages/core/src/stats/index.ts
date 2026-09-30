/* ==========================================================================
   STATS — 파생 통계 (개인화 엔진의 입력)
   js/store.js:111-202 에서 이동. 계산식은 한 줄도 변경하지 않았다.

   변경점은 시그니처뿐:
     before  getStats()               // 모듈 내부 state 를 읽음
     after   getStats(records, now?)  // 인자로 받음 (순수 함수)
   ========================================================================== */
import type { HikeRecord, LevelValue, Stats, StatsFull, TrendDirection } from '../types';
import { clampLevel } from '../levels';

export function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/**
 * 최근 절반 vs 이전 절반 비교 → 변화율(%).
 * ISSUE-002: 화면 문구는 "지난 산행보다"라고 표현하지만 실제로는 절반끼리의 비교다.
 *            문구와 계산이 불일치하나, 이번 단계에서는 고치지 않는다.
 */
export function changeRate(values: number[]): number {
  if (values.length < 2) return 0;
  const mid = Math.ceil(values.length / 2);
  const recent = values.slice(0, mid); // 최신순 정렬 가정
  const older = values.slice(mid);
  if (!older.length) return 0;
  const a = mean(recent);
  const b = mean(older);
  if (!b) return 0;
  return ((a - b) / b) * 100;
}

/**
 * 모든 화면이 참조하는 단일 통계 소스.
 * 데이터가 없으면 hasData:false 를 돌려주고, 존재하지 않는 값을 지어내지 않는다.
 *
 * @param records 최신순으로 정렬된 산행 기록
 * @param now     "현재" 시각 (테스트 결정성을 위해 주입 가능)
 */
export function getStats(records: HikeRecord[], now: number = Date.now()): Stats {
  const recs = records; // 최신순
  const count = recs.length;

  const base = {
    count,
    hasData: count > 0,
    hasEnoughData: count >= 3,
    /* ISSUE-008: 개인화 활성화 기준 3회가 코드에 하드코딩되어 있다 (제품 정책) */
    stage: (count === 0 ? 'new' : count < 3 ? 'growing' : 'personalized') as StatsFull['stage']
  };
  if (!count) return base;

  const distances = recs.map((r) => r.distance);
  const ascents = recs.map((r) => r.ascent);
  const durations = recs.map((r) => r.duration);
  const levels = recs.map((r) => r.level || 2);
  const paces = recs.filter((r) => r.avgPace > 0).map((r) => r.avgPace);

  /* 산행 간격(일) — 가장 개인화의 핵심 지표 */
  const gaps: number[] = [];
  for (let i = 0; i < recs.length - 1; i++) {
    gaps.push((recs[i].date - recs[i + 1].date) / 86400000);
  }
  const notableGaps = gaps.filter((g) => g >= 0.5); // 같은 날 중복 제외

  const avgDistance = mean(distances);
  const avgAscent = mean(ascents);
  const avgDuration = mean(durations);
  const avgGap = notableGaps.length ? mean(notableGaps) : null;
  const avgPace = mean(paces);
  const avgLevel = mean(levels);

  const daysSinceLast = (now - recs[0].date) / 86400000;

  const distanceTrend = changeRate(distances);
  const ascentTrend = changeRate(ascents);
  const paceStability = mean(recs.map((r) => r.paceStability || 0));
  const stabilityTrend = changeRate(recs.map((r) => r.paceStability || 0));

  const totalDistance = sum(distances);
  const totalAscent = sum(ascents);
  const totalDuration = sum(durations);
  const totalCalories = sum(recs.map((r) => r.calories || 0));

  /* 선호 난이도 — 최빈값 */
  const counts: Record<number, number> = {};
  levels.forEach((l) => {
    counts[l] = (counts[l] || 0) + 1;
  });
  const preferredLevel = clampLevel(
    Number(Object.keys(counts).sort((a, b) => counts[Number(b)] - counts[Number(a)])[0])
  ) as LevelValue;

  /* 추세 판정 */
  let trendDirection: TrendDirection = 'flat';
  const combined = (distanceTrend + ascentTrend) / 2;
  if (combined > 3) trendDirection = 'up';
  else if (combined < -3) trendDirection = 'down';

  return {
    ...base,
    avgDistance, avgAscent, avgDuration, avgGap, avgPace, avgLevel,
    totalDistance, totalAscent, totalDuration, totalCalories,
    daysSinceLast, distanceTrend, ascentTrend, stabilityTrend, paceStability,
    preferredLevel, trendDirection,
    last: recs[0],
    previous: recs[1] || null,
    records: recs,
    /* 최근 8회 시계열 (오래된 → 최신, 그래프용) */
    series: recs.slice(0, 8).slice().reverse()
  };
}
