/* ==========================================================================
   날씨 fixture — 프로토타입 제공자
   --------------------------------------------------------------------------
   core 는 날씨를 주입받는다 (weather/index.ts 의 WeatherProvider).
   이 파일은 그 인터페이스를 만족하는 "가짜 제공자" 일 뿐이며,
   실제 날씨 API 를 붙일 때 제공자만 교체하면 core 는 수정하지 않는다.

   ISSUE-004 해소: 날짜가 '10월 4일 (토)' 로 고정되어 있었으나,
                   이제 대상 산행일에서 파생한다.
                   조건(기온 · 강수 등)은 여전히 프로토타입 mock 이다.
   ========================================================================== */
import type { Weather } from '../types';
import { fmtDateWithWeekday } from '../format';
import type { WeatherProvider } from '../weather';

/** mock 날씨 조건 — 날짜를 제외한 부분. 값은 원본과 동일하다. */
export const MOCK_CONDITIONS: Omit<Weather, 'date'> = {
  condition: '맑음',
  icon: 'fa-sun',
  tempMin: 8,
  tempMax: 15,
  humidity: 52,
  rain: 10,
  wind: 2.4,
  air: '보통',
  summary: '산행하기 좋은 날씨입니다. 아침 기온이 낮아 보온 레이어를 권장합니다.'
};

/**
 * 프로토타입 날씨 제공자.
 * 예보 범위 안의 어떤 날짜든 같은 mock 조건을 돌려주고, 날짜 라벨만 반영한다.
 * 실제 서비스에서는 API 제공자로 교체한다.
 */
export const mockWeatherProvider: WeatherProvider = (date: number): Weather => ({
  ...MOCK_CONDITIONS,
  date: fmtDateWithWeekday(date)
});
