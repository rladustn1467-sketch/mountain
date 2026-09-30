/* ==========================================================================
   CORE TYPES — 플랫폼 중립 도메인 타입
   --------------------------------------------------------------------------
   웹 · iOS · Android · 서버가 공유한다.
   브라우저 전용 타입(HTMLElement, Storage 등)을 참조하지 않는다.
   ========================================================================== */

/* ------------------------------ 난이도 ------------------------------ */
export type LevelValue = 1 | 2 | 3 | 4;
export type LevelKey = 'easy' | 'medium' | 'hard' | 'expert';

export interface LevelDef {
  key: LevelKey;
  label: string;
  en: string;
}

/* ------------------------------ 프로필 ------------------------------ */
export type Experience = 'new' | 'casual' | 'regular';
export type Preference = 'light' | 'moderate' | 'challenge';
export type Goal = 'health' | 'fitness' | 'stress' | 'newcourse' | 'light';
export type Plan = 'week' | '2-3w' | 'month' | 'unknown';
export type Gender = 'male' | 'female' | 'none';

export interface Profile {
  name?: string;
  age?: number | null;
  gender?: Gender;
  weight?: number | null;
  height?: number | null;
  wearable?: string;
  experience?: Experience;
  preference?: Preference;
  goal?: Goal;
  plan?: Plan;
}

/* ------------------------------ 산행 기록 ------------------------------ */
export interface Split {
  km: number;
  pace: number;
}

export interface HikeRecord {
  id: string;
  /** epoch milliseconds */
  date: number;
  courseId: string | null;
  name: string;
  /** km */
  distance: number;
  /** 초 (seconds) — ISSUE-001: Course.duration 은 분 단위다 */
  duration: number;
  /** m */
  ascent: number;
  /** m */
  descent: number;
  /** 분/km */
  avgPace: number;
  calories: number;
  level: LevelValue;
  /** m */
  maxAlt: number;
  /** 0~100 */
  paceStability: number;
  /** 고도 프로파일 — ISSUE-003: 코스에서 그대로 복사되어 중복 저장된다 */
  elevation?: number[];
  splits: Split[];
}

/* ------------------------------ 코스 ------------------------------ */
export interface Course {
  id: string;
  name: string;
  region: string;
  /** km */
  distance: number;
  /** 분 (minutes) — ISSUE-001: HikeRecord.duration 은 초 단위다 */
  duration: number;
  /** m */
  ascent: number;
  level: LevelValue;
  calories: number;
  /** 플랫폼별 이미지 매핑에 쓰이는 논리적 키 (경로가 아님) */
  image: string;
  tags: string[];
  surface: string;
  water: string;
  highlights: string[];
  risks: string[];
  elevation: number[];
}

/* ------------------------------ 날씨 ------------------------------ */
export interface Weather {
  /** 표시용 문자열 — ISSUE-004: 고정 문자열이라 실제 날짜와 무관하다 */
  date: string;
  condition: string;
  /** 표현 계층용 아이콘 키 — ISSUE-006 */
  icon: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  /** 강수 확률 % */
  rain: number;
  /** m/s */
  wind: number;
  air: string;
  summary: string;
}

/* ------------------------------ 온보딩 선택지 ------------------------------ */
export interface OnboardingOption<V extends string = string> {
  value: V;
  /** ISSUE-005: 문구/이모지는 Phase 2 에서 copy 계층으로 분리한다 */
  emoji: string;
  title: string;
  desc: string;
}

export interface OnboardingOptions {
  experience: OnboardingOption<Experience>[];
  preference: OnboardingOption<Preference>[];
  goal: OnboardingOption<Goal>[];
  plan: OnboardingOption<Plan>[];
}

/* ------------------------------ 환경설정 / 앱 상태 ------------------------------ */
export interface Prefs {
  theme: string;
  buttonShape: string;
  customPrimary: string | null;
  customSecondary: string | null;
  units: string;
  notifications: boolean;
}

export interface UiState {
  homeStageSeen: Record<string, unknown>;
  onboardedAt: number | null;
}

export interface AppState {
  profile: Profile | null;
  records: HikeRecord[];
  prefs: Prefs;
  ui: UiState;
}

/* ------------------------------ 파생 통계 ------------------------------ */
export type Stage = 'new' | 'growing' | 'personalized';
export type TrendDirection = 'flat' | 'up' | 'down';

export interface StatsBase {
  count: number;
  hasData: boolean;
  hasEnoughData: boolean;
  stage: Stage;
}

export interface StatsFull extends StatsBase {
  avgDistance: number;
  avgAscent: number;
  avgDuration: number;
  /** 평균 산행 간격(일). 산출 불가 시 null */
  avgGap: number | null;
  avgPace: number;
  avgLevel: number;
  totalDistance: number;
  totalAscent: number;
  totalDuration: number;
  totalCalories: number;
  daysSinceLast: number;
  /** % — ISSUE-002: "최근 절반 vs 이전 절반" 비교값이다 */
  distanceTrend: number;
  ascentTrend: number;
  stabilityTrend: number;
  paceStability: number;
  preferredLevel: LevelValue;
  trendDirection: TrendDirection;
  last: HikeRecord;
  previous: HikeRecord | null;
  records: HikeRecord[];
  /** 오래된 → 최신 순, 그래프용 (최대 8회) */
  series: HikeRecord[];
}

export type Stats = StatsBase | StatsFull;

export function hasStatsData(s: Stats): s is StatsFull {
  return s.hasData === true;
}

/* ------------------------------ AI 분석 ------------------------------ */
export interface AnalysisPoint {
  /** 표현 계층용 아이콘 키 — ISSUE-006 */
  icon: string;
  /** ISSUE-005: 한국어 + HTML 태그를 포함한다. Phase 2 에서 분리 */
  text: string;
}

export interface Analysis {
  headline: string;
  points: AnalysisPoint[];
  confidence: number;
  baseline?: boolean;
}

/* ------------------------------ 추천 ------------------------------ */
export type RecommendationBasis = 'basic' | 'partial' | 'personalized';

export interface RecommendedCourse extends Course {
  rank: number;
  matched: number;
  reasonText: string;
}

export interface Recommendation {
  basis: RecommendationBasis;
  targetLevel: LevelValue;
  targetDistance: number;
  /** ISSUE-005: 한국어 + HTML 태그 포함 */
  reasons: string[];
  courses: RecommendedCourse[];
  weather: Weather;
  confidence: number;
}

/* ------------------------------ 이번 산행 목표 ------------------------------ */
export interface GoalPlan {
  distance: number;
  /** 분 (Course.duration 과 동일 단위) */
  duration: number;
  level: LevelValue;
  mainGoal: string;
  water: string;
  waterReminder: string;
  paceTarget: number | null;
  note: string;
}
