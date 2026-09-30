/* ==========================================================================
   STATS — 파생 통계
   js/store.js:111-202 에서 이동.

   --------------------------------------------------------------------------
   ISSUE-008 결정 (2026-09-30) — "개인화 활성화" 개념 제거
   --------------------------------------------------------------------------
   이 앱은 기록 3회가 쌓인 뒤부터 개인화되는 서비스가 아니다.
   온보딩에서 받은 정보로 첫 산행부터 개인화된 추천을 제공하는 것이 기본이고,
   기록이 쌓이면 개인화에 쓸 수 있는 데이터가 늘어나는 구조다.

   따라서 삭제한 것:
     stage          'new' | 'growing' | 'personalized' 3단계 상태
     hasEnoughData  count >= 3 단일 게이트

   대신 "이 기능을 보여줄 만한 데이터가 있는가" 를 기능별로 정의한다(capabilities).
   임계값은 아래 상수 한곳에 모여 있고, 산행 주기와는 연결하지 않는다.

   --------------------------------------------------------------------------
   ISSUE-007 결정 — 날짜 · 일수 계산은 Asia/Seoul 고정
   --------------------------------------------------------------------------
   산행 간격(gaps)과 마지막 산행 이후 경과일(daysSinceLast)을 경과 시간이 아니라
   한국 달력 기준 일수 차이로 센다. "며칠 간격" 은 사용자에게 달력 개념이다.

   주의: avgGap / daysSinceLast 는 난이도 결정에 쓰지 않는다 (제품 결정).
         학습된 패턴 표시와 계획 참고 정보로만 쓴다.
   ========================================================================== */
import type { DataCapabilities, HikeRecord, LevelValue, Stats, StatsFull, TrendDirection } from '../types';
import { clampLevel } from '../levels';
import { kstDayDiff } from '../time';

/* --------------------------------------------------------------------------
   기능별 최소 데이터 조건 (제품 정책값)
   -------------------------------------------------------------------------- */

/** 이전 산행 대비 델타 — 비교 대상이 1건 있어야 한다 */
export const MIN_RECORDS_FOR_COMPARISON = 2;

/** 회차별 그래프(스파크라인 · 미니바) — 점이 2개 이상이어야 선이 된다 */
export const MIN_RECORDS_FOR_SERIES = 2;

/** 선호 난이도(최빈값) — 1건이면 그 기록의 난이도일 뿐 "선호" 가 아니다 */
export const MIN_RECORDS_FOR_PREFERRED_LEVEL = 2;

/**
 * 추세 · 장기 변화 분석 — "최근 절반 vs 이전 절반" 비교가 성립할 최소치.
 * 기존 코드의 임계값 3 을 그대로 승계했다. 통계적으로는 양쪽 절반에 2건씩
 * 들어가는 4 가 더 타당하므로, 값 조정은 별도 결정 사항으로 남긴다.
 */
export const MIN_RECORDS_FOR_TREND = 3;

/** 평균 산행 주기 — 같은 날이 아닌 간격이 1개 이상 필요하다 */
export const MIN_GAPS_FOR_INTERVAL = 1;

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

/** 기록 수 · 간격 수로부터 기능별 표시 가능 여부를 판정한다 */
export function computeCapabilities(count: number, gapCount: number): DataCapabilities {
  return {
    canCompareWithPrevious: count >= MIN_RECORDS_FOR_COMPARISON,
    canShowSeries: count >= MIN_RECORDS_FOR_SERIES,
    canInferPreferredLevel: count >= MIN_RECORDS_FOR_PREFERRED_LEVEL,
    canAnalyzeTrend: count >= MIN_RECORDS_FOR_TREND,
    canEstimateInterval: gapCount >= MIN_GAPS_FOR_INTERVAL
  };
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

  if (!count) {
    return {
      count: 0,
      hasData: false,
      capabilities: computeCapabilities(0, 0)
    };
  }

  const distances = recs.map((r) => r.distance);
  const ascents = recs.map((r) => r.ascent);
  const durations = recs.map((r) => r.duration);
  const levels = recs.map((r) => r.level || 2);
  const paces = recs.filter((r) => r.avgPace > 0).map((r) => r.avgPace);

  /* 산행 간격(일) — 한국 달력 기준 (ISSUE-007). 표시 · 계획 참고용 */
  const gaps: number[] = [];
  for (let i = 0; i < recs.length - 1; i++) {
    gaps.push(kstDayDiff(recs[i].date, recs[i + 1].date));
  }
  const notableGaps = gaps.filter((g) => g >= 1); // 같은 날 중복 제외

  const avgDistance = mean(distances);
  const avgAscent = mean(ascents);
  const avgDuration = mean(durations);
  const avgGap = notableGaps.length ? mean(notableGaps) : null;
  const avgPace = mean(paces);
  const avgLevel = mean(levels);

  /* 마지막 산행 이후 경과일 — 한국 달력 기준 */
  const daysSinceLast = kstDayDiff(now, recs[0].date);

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
    count,
    hasData: true,
    capabilities: computeCapabilities(count, notableGaps.length),
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
