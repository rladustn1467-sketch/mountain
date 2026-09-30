/* ==========================================================================
   CHARTS GEOMETRY — 차트의 "좌표 계산"만 담당하는 플랫폼 중립 계층
   --------------------------------------------------------------------------
   js/charts.js 에서 계산 부분만 이동했다. 계산식 · 상수 · 반올림 자릿수는
   한 글자도 바꾸지 않았다 (동작 보존이 이번 작업의 목표).

   왜 분리하는가:
     웹은 SVG 문자열을, React Native 는 react-native-svg 컴포넌트를 쓴다.
     하지만 "어디에 점을 찍을지"는 양쪽이 완전히 같다.
     → 좌표/경로 계산은 core, 실제 렌더는 플랫폼이 담당한다.

   SVG path 의 d 문법("M40.0 12.3 L…")은 웹과 react-native-svg 가 동일하게
   해석하므로 core 가 만들어도 안전하다. 색 · 굵기 · 그라디언트 · 접근성
   속성처럼 플랫폼마다 표현이 다른 것은 core 에 두지 않는다.

   ISSUE-017 의 분리 작업. 계산 개선은 하지 않았다.
   ========================================================================== */

export interface Point {
  x: number;
  y: number;
}

/* path 문자열 생성 — 원본과 동일한 소수점 1자리 포맷 */
function toLinePath(points: Point[]): string {
  return points
    .map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1))
    .join(' ');
}

function toAreaPath(points: Point[], linePath: string, baselineY: number): string {
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath} L ${last.x.toFixed(1)} ${baselineY} L ${first.x.toFixed(1)} ${baselineY} Z`;
}

/* ==========================================================================
   1. 고도 프로필 (area chart)
   ========================================================================== */
export interface ElevationOptions {
  width?: number;
  height?: number;
  /** false 면 0 기준 절대 스케일, 그 외(기본)는 min~max 정규화 */
  flatten?: boolean;
}

export interface ElevationGeometry {
  width: number;
  height: number;
  pad: number;
  min: number;
  max: number;
  range: number;
  points: Point[];
  linePath: string;
  areaPath: string;
  peak: Point;
  peakIndex: number;
  /** 배경 점선 그리드의 y 좌표 2개 */
  gridY: [number, number];
}

export function elevationGeometry(values: number[], opts: ElevationOptions = {}): ElevationGeometry {
  const width = opts.width || 340;
  const height = opts.height || 120;
  const pad = 8;
  const flat = opts.flatten !== false;

  const max = Math.max.apply(null, values);
  const min = Math.min.apply(null, values);
  const range = Math.max(1, max - min);
  const stepX = (width - pad * 2) / (values.length - 1);

  const points: Point[] = values.map((v, i) => ({
    x: pad + i * stepX,
    y: flat
      ? pad + (1 - (v - min) / range) * (height - pad * 2)
      : height - pad - (v / max) * (height - pad * 2)
  }));

  const linePath = toLinePath(points);
  const peakIndex = values.indexOf(max);

  return {
    width, height, pad, min, max, range,
    points,
    linePath,
    areaPath: toAreaPath(points, linePath, height),
    peak: points[peakIndex],
    peakIndex,
    gridY: [height * 0.33, height * 0.66]
  };
}

/* ==========================================================================
   2. 스파크라인 (추세)
   ========================================================================== */
export interface SparklineOptions {
  height?: number;
}

export interface SparklineGeometry {
  width: number;
  height: number;
  pad: number;
  min: number;
  max: number;
  range: number;
  points: Point[];
  linePath: string;
  areaPath: string;
}

/** 값이 없으면 null 을 반환한다 (원본은 빈 문자열을 반환했다 — 렌더 측에서 처리) */
export function sparklineGeometry(
  values: number[],
  opts: SparklineOptions = {}
): SparklineGeometry | null {
  if (!values.length) return null;

  const width = 300;
  const height = opts.height || 54;
  const pad = 6;

  const max = Math.max.apply(null, values);
  const min = Math.min.apply(null, values);
  const range = Math.max(1, max - min);
  const stepX = (width - pad * 2) / Math.max(1, values.length - 1);

  const points: Point[] = values.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - ((v - min) / range) * (height - pad * 2)
  }));

  const linePath = toLinePath(points);

  return {
    width, height, pad, min, max, range,
    points,
    linePath,
    areaPath: toAreaPath(points, linePath, height)
  };
}

/* ==========================================================================
   3. 링 게이지 (0~100)
   ========================================================================== */
export interface RingGeometry {
  size: number;
  stroke: number;
  radius: number;
  center: number;
  circumference: number;
  /** 0~100 으로 클램프된 값 */
  pct: number;
  /** stroke-dasharray 의 앞쪽 값 */
  dash: number;
  /** 표시용 정수 */
  display: number;
}

export function ringGeometry(value: number): RingGeometry {
  const size = 132;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));

  return {
    size,
    stroke,
    radius,
    center: size / 2,
    circumference,
    dash: (pct / 100) * circumference,
    pct,
    display: Math.round(pct)
  };
}

/* ==========================================================================
   4. 수직 바 (회차별 기록)
   ========================================================================== */
export interface BarInput {
  label: string;
  short: string;
  value: number;
}

export interface BarItem extends BarInput {
  /** 0~100 (%) — 소수점 1자리 문자열로 쓰이는 원본 수치 */
  heightPct: number;
}

export interface BarsGeometry {
  max: number;
  items: BarItem[];
}

export function barsGeometry(items: BarInput[]): BarsGeometry {
  const max = Math.max.apply(null, items.map((i) => i.value).concat([1]));
  return {
    max,
    items: items.map((it) => ({ ...it, heightPct: (it.value / max) * 100 }))
  };
}

/* ==========================================================================
   5. 트레일 경로 (프로토타입)
   --------------------------------------------------------------------------
   ISSUE-018: 경로가 코스와 무관한 고정 path 이고, 현재 위치 마커도
              진행률에 따라 움직이지 않는다. 실제 지도 도입 시 대체된다.
              (이번 작업에서는 동작을 그대로 옮기기만 했다)
   ========================================================================== */
export interface TrailGeometry {
  viewWidth: number;
  viewHeight: number;
  /** 등산로 경로 */
  path: string;
  /** 배경 등고선 경로들 */
  contours: string[];
  start: Point;
  summit: Point;
  /** 현재 위치 마커 — 원본과 동일하게 출발점에 고정되어 있다 (ISSUE-018) */
  marker: Point;
  /** 경로 전체 길이(고정 상수) */
  totalLength: number;
  /** 진행률이 반영된 dasharray 앞쪽 값 */
  dash: number;
  /** 0~100 으로 정규화된 진행률 */
  progress: number;
}

const TRAIL_PATH = 'M40 150 C 80 120, 92 78, 140 66 S 214 92, 244 58 S 300 30, 316 54';

const TRAIL_CONTOURS = [
  'M-10 40 C 60 10, 120 80, 190 44 S 300 12, 380 48',
  'M-10 78 C 60 48, 126 118, 196 82 S 306 50, 386 86',
  'M-10 116 C 60 86, 122 156, 192 120 S 302 88, 382 124',
  'M-10 154 C 60 124, 126 194, 196 158 S 306 126, 386 162'
];

export function trailGeometry(progress?: number): TrailGeometry {
  const p = typeof progress === 'number' ? progress : 0;
  const totalLength = 340;

  return {
    viewWidth: 360,
    viewHeight: 190,
    path: TRAIL_PATH,
    contours: TRAIL_CONTOURS,
    start: { x: 40, y: 150 },
    summit: { x: 316, y: 54 },
    marker: { x: 40, y: 150 },
    totalLength,
    dash: (p / 100) * totalLength,
    progress: p
  };
}
