/* ==========================================================================
   ICONS — 웹 아이콘 매핑 (ISSUE-006)
   --------------------------------------------------------------------------
   core 는 'trend-up' 같은 의미 키만 내보낸다. 이 파일이 그것을 웹에서 쓰는
   Font Awesome 클래스로 바꾼다. 모바일은 같은 키를 자신의 아이콘 세트로
   매핑하면 되고, core 는 수정하지 않는다.

   키를 추가하면 여기에도 반드시 추가해야 한다 — 누락되면 콘솔 경고가 남고
   기본 아이콘으로 대체된다.
   ========================================================================== */
window.HHC = window.HHC || {};

HHC.icons = (function () {
  /* 의미 키 → Font Awesome 클래스. 기존 렌더 출력과 1:1로 동일하다. */
  var FA = {
    /* 이정표 · 기준선 */
    'flag': 'fa-flag',
    'flag-finish': 'fa-flag-checkered',
    'brain': 'fa-brain',
    'route': 'fa-route',
    /* 추세 */
    'trend-up': 'fa-arrow-trend-up',
    'trend-down': 'fa-arrow-trend-down',
    'equal': 'fa-equals',
    /* 고도 */
    'mountain': 'fa-mountain',
    'mountain-sun': 'fa-mountain-sun',
    /* 페이스 · 체력 */
    'pace-stability': 'fa-wave-square',
    'strength': 'fa-dumbbell',
    /* 주기 · 일정 */
    'interval': 'fa-clock-rotate-left',
    'calendar': 'fa-calendar-days',
    /* 난이도 제안 */
    'level-up': 'fa-arrow-up-right-dots',
    'recovery': 'fa-shield-heart',
    'balanced': 'fa-scale-balanced',
    /* 날씨 */
    'weather-clear': 'fa-sun'
  };

  var FALLBACK = 'fa-circle-info';
  var warned = {};

  /**
   * 의미 키를 Font Awesome 클래스로 바꾼다.
   * 이미 'fa-' 로 시작하는 값은 화면 코드가 직접 지정한 것으로 보고 그대로 통과시킨다
   * (화면 계층은 Font Awesome 을 직접 써도 된다 — 웹 전용 계층이므로).
   */
  function fa(key) {
    if (!key) return FALLBACK;
    if (key.indexOf('fa-') === 0) return key;
    if (FA[key]) return FA[key];
    if (!warned[key]) {
      warned[key] = true;
      console.warn('[HHC.icons] 매핑되지 않은 아이콘 키:', key, '— js/icons.js 에 추가하세요');
    }
    return FALLBACK;
  }

  /** core 의 키 목록과 웹 매핑이 어긋나지 않았는지 확인 (개발용) */
  function missingKeys() {
    var keys = (window.HHCCore && window.HHCCore.ICON_KEYS) || [];
    return keys.filter(function (k) { return !FA[k]; });
  }

  return { fa: fa, map: FA, missingKeys: missingKeys };
})();
