/* ==========================================================================
   STORE — 웹 어댑터 (상태 보관 + localStorage + core 위임)
   --------------------------------------------------------------------------
   핵심 순환 구조는 그대로다:

     산행 완료 → 기록 추가 → 통계 재계산 → AI 분석 갱신 → 다음 추천 변경

   다만 계산 부분은 전부 @hhc/core 로 이동했다. 이 파일에 남은 책임은 셋이다.

     1. 상태를 메모리에 들고 변경 알림 (subscribe / emit)
     2. localStorage 읽기·쓰기  ← 플랫폼 어댑터. core 는 이 코드를 모른다
     3. core 의 순수 함수에 현재 상태를 넘겨 호출

   core 로 이동한 것:
     getStats · buildAnalysis · recommendNext · buildGoalPlan
     fmtDur / fmtDurClock / fmtPace / fmtDate / fmtRelative
     DEFAULT_STATE · load 병합 · addRecord 기본값 · seedDemo 생성 로직

   공개 API(HHC.store.*)는 이전과 동일하다. 화면 코드는 수정하지 않았다.
   ========================================================================== */
window.HHC = window.HHC || {};

(function () {
  var core = window.HHCCore;
  if (!core) throw new Error('[HHC] @hhc/core 번들이 로드되지 않았습니다.');

  var STORAGE_KEY = 'hhc.state.v1';

  var state = load();
  var listeners = new Set();

  /* ------------------------ 파생값 캐시 (ISSUE-016) ------------------------
     한 화면을 그리는 동안 getStats() / recommendNext() 가 여러 번 호출된다
     (홈 · 추천 · 코스상세 · 분석 · 패턴). 계산 결과는 순수 함수의 출력이므로
     "상태가 그대로면 결과도 그대로" 다. 상태 변경 시에만 캐시를 버린다.

     캐시 키에 한국 달력 일자를 포함해, 자정을 넘기면 자동으로 무효화된다
     (daysSinceLast · 예정일 계산이 날짜에 의존하므로).
     계산식과 결과는 바뀌지 않는다. 호출 횟수만 줄어든다. */
  var version = 0;
  var cache = {};

  function invalidate() { version += 1; cache = {}; }

  function cached(key, compute) {
    var stamp = version + ':' + core.kstDayIndex(Date.now());
    if (cache.stamp !== stamp) cache = { stamp: stamp };
    if (!(key in cache)) cache[key] = compute();
    return cache[key];
  }

  /* ======================= persistence (웹 전용) =======================
     이 두 함수가 StateRepository 인터페이스(core/state/repository.ts)의
     웹 구현체다. 모바일은 SQLite / AsyncStorage, 서버는 HTTP 로 대체한다. */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return core.createDefaultState();
      return core.mergeState(JSON.parse(raw));
    } catch (e) {
      return core.createDefaultState();
    }
  }
  function persist() {
    invalidate();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ISSUE-013: quota 초과를 조용히 무시한다 (기존 동작 유지) */
    }
  }
  function emit() { listeners.forEach(function (fn) { fn(state); }); }

  function subscribe(fn) {
    listeners.add(fn);
    return function () { listeners.delete(fn); };
  }
  function get() { return state; }

  /* ============================ mutations ============================ */
  function saveProfile(profile) {
    state.profile = Object.assign({}, state.profile, profile);
    if (!state.ui.onboardedAt) state.ui.onboardedAt = Date.now();
    persist(); emit();
    return state.profile;
  }

  function addRecord(record) {
    var rec = core.createRecord(record);
    state.records.unshift(rec);
    state.records = core.sortRecordsByDateDesc(state.records);
    persist(); emit();
    return rec;
  }

  function deleteRecord(id) {
    state.records = state.records.filter(function (r) { return r.id !== id; });
    persist(); emit();
  }

  function resetAll() {
    state = core.createDefaultState();
    persist(); emit();
  }

  function setPref(key, value) {
    state.prefs[key] = value;
    persist(); emit();
  }

  function setUi(key, value) {
    state.ui[key] = value;
    persist();
  }

  /* =================== core 위임 (계산은 전부 core) =================== */

  /** 파생 통계 */
  function getStats() {
    return cached('stats', function () { return core.getStats(state.records); });
  }

  /** AI 분석 문장 */
  function buildAnalysis() {
    return cached('analysis', function () { return core.buildAnalysis(state.records); });
  }

  /** 다음 산행 추천 — core 는 코스 · 날씨 · 프로필을 주입받는다 */
  function recommendNext() {
    return cached('recommend', function () {
      var info = HHC.weatherInfo;
      return core.recommendNext({
        records: state.records,
        profile: state.profile,
        courses: HHC.COURSES,
        weather: info.weather,            /* 예보 범위를 넘으면 null */
        targetDateLabel: info.target.label
      });
    });
  }

  /** 이번 산행 목표 카드 */
  function buildGoalPlan(course) {
    return core.buildGoalPlan(course, {
      records: state.records,
      profile: state.profile
    });
  }

  /* ============ 데모 시드 (생성은 core, 저장은 이 어댑터) ============
     ISSUE-012: 데모 생성기는 별도 번들(core-demo.iife.js)에 있다.
     프로덕션 빌드에서 그 스크립트를 빼면 아래 함수는 사용할 수 없고,
     화면에서도 데모 섹션이 표시되지 않는다. */
  function hasDemo() {
    return !!(window.HHCCoreDemo && window.HHCCoreDemo.createDemoState);
  }

  function seedDemo(kind) {
    if (!hasDemo()) {
      console.warn('[HHC] 데모 번들이 로드되지 않았습니다 (개발 전용).');
      return state;
    }
    var seed = window.HHCCoreDemo.createDemoState({
      kind: kind,
      courses: HHC.COURSES,
      existingProfile: state.profile
    });
    /* 기존 동작 유지: 프로필이 없었을 때만 프로필과 onboardedAt 을 채운다 */
    if (!state.profile) {
      state.profile = seed.profile;
      state.ui.onboardedAt = seed.onboardedAt;
    }
    state.records = seed.records;
    persist(); emit();
    return state;
  }

  /* ============================== expose ============================== */
  window.HHC.store = {
    subscribe: subscribe,
    get: get,
    saveProfile: saveProfile,
    addRecord: addRecord,
    deleteRecord: deleteRecord,
    resetAll: resetAll,
    setPref: setPref,
    setUi: setUi,
    getStats: getStats,
    buildAnalysis: buildAnalysis,
    recommendNext: recommendNext,
    buildGoalPlan: buildGoalPlan,
    seedDemo: seedDemo,
    hasDemo: hasDemo,
    /* 포맷터는 core 의 것을 그대로 노출 (기존 경로 HHC.store.utils.* 유지) */
    utils: {
      fmtDur: core.fmtDur,
      fmtDurClock: core.fmtDurClock,
      fmtPace: core.fmtPace,
      fmtDate: core.fmtDate,
      fmtRelative: core.fmtRelative
    }
  };
})();
