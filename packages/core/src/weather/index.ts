/* ==========================================================================
   WEATHER RESOLUTION — "언제의 날씨를 볼 것인가" 를 결정하는 계층
   --------------------------------------------------------------------------
   ISSUE-004 결정 사항 (A + C 조합):

     C  기본값은 온보딩 Q4(plan)에서 파생한다.
        "이번 주 / 2~3주 후 / 한 달 정도 후 / 모름" → 대상 날짜
     A  사용자가 직접 고른 날짜(override)가 있으면 그것을 우선한다.
     +  예보 가능 범위를 넘는 날짜는 날씨를 만들어내지 않고 null 을 반환한다.
        (데이터가 없으면 지어내지 않는다는 이 서비스의 원칙과 동일)

   core 는 실제 날씨를 가져오지 않는다. WeatherProvider 를 주입받을 뿐이다.
     현재   프로토타입 fixture 제공자
     이후   실제 날씨 API 제공자 (core 는 수정하지 않는다)
   ========================================================================== */
import type { Plan, Weather } from '../types';
import { fmtDateWithWeekday } from '../format';
import { kstStartOfDay } from '../time';

const DAY = 86400000;

/**
 * 온보딩 plan → 대상 산행일까지의 일수.
 * 제품 정책값이므로 한곳에 모아 둔다 (ISSUE-008 과 같은 성격).
 */
export const PLAN_OFFSET_DAYS: Record<Plan, number> = {
  week: 3,
  '2-3w': 18,
  month: 28,
  unknown: 21
};

/**
 * 예보가 의미를 갖는 최대 일수.
 * 일반적인 일별 예보 제공 범위(약 10일)를 기준으로 한다.
 * 이 값을 넘으면 날씨를 추천 근거로 쓰지 않는다.
 */
export const FORECAST_HORIZON_DAYS = 10;

export type HikeDateSource = 'override' | 'plan' | 'default';

export interface HikeDateResolution {
  /** 대상 산행일 (해당 날짜의 자정, epoch ms) */
  date: number;
  /** 오늘로부터 며칠 뒤인가 (음수면 과거) */
  daysAhead: number;
  /** 어떻게 정해졌는가 */
  source: HikeDateSource;
  /** 예보 가능 범위 안인가 */
  inForecastRange: boolean;
  /** 표시용 라벨 — "10월 4일 (토)" */
  label: string;
}

export interface ResolveHikeDateInput {
  /** 온보딩 Q4 값 */
  plan?: Plan | null;
  /** 사용자가 직접 고른 날짜 (epoch ms). 있으면 plan 보다 우선한다 */
  override?: number | null;
  now?: number;
}

export function resolveHikeDate(input: ResolveHikeDateInput = {}): HikeDateResolution {
  const now = input.now ?? Date.now();
  const today = kstStartOfDay(now);   /* 한국 시간 기준 자정 (ISSUE-007) */

  let date: number;
  let source: HikeDateSource;

  if (input.override != null) {
    date = kstStartOfDay(input.override);
    source = 'override';
  } else if (input.plan && PLAN_OFFSET_DAYS[input.plan] != null) {
    date = today + PLAN_OFFSET_DAYS[input.plan] * DAY;
    source = 'plan';
  } else {
    date = today + PLAN_OFFSET_DAYS.unknown * DAY;
    source = 'default';
  }

  const daysAhead = Math.round((date - today) / DAY);

  return {
    date,
    daysAhead,
    source,
    inForecastRange: daysAhead >= 0 && daysAhead <= FORECAST_HORIZON_DAYS,
    label: fmtDateWithWeekday(date)
  };
}

/* --------------------------------------------------------------------------
   날씨 제공자
   -------------------------------------------------------------------------- */

/** 대상 날짜의 날씨를 돌려준다. 알 수 없으면 null. */
export type WeatherProvider = (date: number) => Weather | null;

export interface WeatherResolution {
  /** 대상 산행일 정보 */
  target: HikeDateResolution;
  /** 예보. 범위를 넘거나 제공자가 모르면 null */
  weather: Weather | null;
  /** weather 가 null 인 이유 (null 이 아니면 undefined) */
  unavailableReason?: 'beyond-horizon' | 'no-data';
}

export interface ResolveWeatherInput extends ResolveHikeDateInput {
  provider: WeatherProvider;
}

export function resolveWeather(input: ResolveWeatherInput): WeatherResolution {
  const target = resolveHikeDate(input);

  if (!target.inForecastRange) {
    return { target, weather: null, unavailableReason: 'beyond-horizon' };
  }

  const weather = input.provider(target.date);
  if (!weather) {
    return { target, weather: null, unavailableReason: 'no-data' };
  }
  return { target, weather };
}
