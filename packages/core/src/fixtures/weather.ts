/* 날씨 — 프로토타입 fixture.
   core 는 날씨를 "주입받는" 구조이며, 이 값은 기본값일 뿐이다.
   실제 날씨 API 를 붙이면 이 파일을 대체하지 않고 호출 측에서 다른 Weather 를 넘긴다.
   js/data.js 의 HHC.WEATHER 에서 이동. 값은 변경하지 않았다. */
import type { Weather } from '../types';

export const DEFAULT_WEATHER: Weather = {
  date: '10월 4일 (토)',
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
