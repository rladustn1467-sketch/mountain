/* ==========================================================================
   DATA — 웹 어댑터
   --------------------------------------------------------------------------
   도메인 데이터는 @hhc/core 로 이동했다. 이 파일은 core 의 값을 기존
   HHC.* 이름으로 그대로 재노출하는 얇은 어댑터다.
   화면 코드(js/screens/*.js)는 수정하지 않았다.

   core 로 이동 : LEVELS · LEVEL_BY_KEY · COURSES · ONBOARDING · WEATHER
   웹에 남김    : IMAGES (플랫폼별 자산 경로이므로 core 에 두지 않는다)
   ========================================================================== */
window.HHC = window.HHC || {};

(function () {
  var core = window.HHCCore;
  if (!core) {
    throw new Error('[HHC] @hhc/core 번들이 로드되지 않았습니다. ' +
      'index.html 의 packages/core/dist/core.iife.js 를 확인하세요 (빌드: npm run core:build).');
  }

  /* core 를 앱 전역에 노출 — store 어댑터와 향후 코드가 참조한다 */
  HHC.core = core;

  /* --------------------------------------------------------------------
     이미지 — 웹 전용 자산 경로.
     Course.image 는 core 에서 'valley' 같은 논리적 키만 갖고 있고,
     실제 경로 매핑은 플랫폼이 담당한다.
     -------------------------------------------------------------------- */
  HHC.IMAGES = {
    ridge: 'images/hero-ridge.jpg',
    peak: 'images/course-peak.jpg',
    valley: 'images/course-valley.jpg',
    chiangrai: 'images/course-chiangrai.jpg',
    mist: 'images/course-mist.jpg',
    fog: 'images/course-fog.jpg'
  };

  /* --------------------------------------------------------------------
     core 도메인 값 재노출 (기존 API 표면 유지)
     -------------------------------------------------------------------- */
  HHC.LEVELS = core.LEVELS;
  HHC.LEVEL_BY_KEY = core.LEVEL_BY_KEY;
  HHC.COURSES = core.COURSES;
  HHC.ONBOARDING = core.ONBOARDING;

  /* 날씨는 core 가 "주입받는" 값이다. 웹은 현재 프로토타입 fixture 를 쓴다.
     실제 날씨 API 를 붙이면 이 한 줄만 교체한다. */
  HHC.WEATHER = core.DEFAULT_WEATHER;
})();
