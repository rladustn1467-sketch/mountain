/* ==========================================================================
   APP — 부트스트랩, 전역 이벤트 위임, 탭 연결, 뒤로가기 처리
   ========================================================================== */
(function () {
  const { router, store, tabbar, theme } = HHC;

  /* 스크롤 위치 초기화 유틸 */
  function scrollTop() {
    const view = document.getElementById('view');
    if (view) view.scrollTop = 0;
    const body = view && view.querySelector('.screen__body, .screen__scroll');
    if (body) body.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  HHC.scrollTop = scrollTop;

  /* ---------------------- 탭 ↔ 라우트 매핑 ---------------------- */
  const TAB_ROUTES = {
    home: 'home',
    recommend: 'recommend',
    hiking: 'hiking-live',
    records: 'records',
    profile: 'profile'
  };
  /* 각 탭의 진입 상태 기억 (마지막 화면 유지) */
  const tabMemory = {};

  HHC.actions = {
    goTab(name) {
      const route = TAB_ROUTES[name];
      if (!route) return;
      tabbar.setActive(name);
      /* 산행 탭: 진행 중 세션이 있으면 live, 없으면 setup 안내 */
      if (name === 'hiking') {
        router.go('hiking-live');
      } else {
        router.go(tabMemory[name] || route);
      }
    }
  };

  /* ---------------------- 전역 클릭 위임 ---------------------- */
  function bindGlobalDelegation() {
    document.addEventListener('click', (e) => {
      /* 뒤로가기 버튼 (data-nav="back") */
      const navBtn = e.target.closest('[data-nav="back"]');
      if (navBtn) {
        if (!router.back()) router.go('home');
        return;
      }
      /* 라우트 이동 (data-go="route") */
      const goBtn = e.target.closest('[data-go]');
      if (goBtn) {
        const route = goBtn.dataset.go;
        const params = {};
        if (goBtn.dataset.course) params.course = goBtn.dataset.course;
        if (goBtn.dataset.record) params.record = goBtn.dataset.record;
        /* 신규 온보딩 재시작 */
        if (goBtn.dataset.fresh && HHC.resetOnboarding) HHC.resetOnboarding();
        router.go(route, params);
        scrollTop();
        return;
      }
    });
  }

  /* ---------------------- 라우트 변경 훅 ---------------------- */
  HHC.screens = HHC.screens || {};
  HHC.screens.onRouteChange = function (cur) {
    const name = cur.name;
    /* 탭바 표시 여부 : 온보딩 계열은 숨김 */
    const hiddenOn = ['splash', 'intro', 'onboard', 'first-recommend'];
    const showNav = !hiddenOn.includes(name);
    tabbar.show(showNav);
    if (showNav) {
      /* 현재 화면이 어느 탭인지 판정 */
      let tab = null;
      if (['home'].includes(name)) tab = 'home';
      else if (['recommend', 'course-detail'].includes(name)) tab = 'recommend';
      else if (['hiking-setup', 'hiking-live', 'hike-result', 'analysis'].includes(name)) tab = 'hiking';
      else if (['records', 'record-detail', 'patterns'].includes(name)) tab = 'records';
      else if (['profile'].includes(name)) tab = 'profile';
      if (tab) { tabbar.setActive(tab); tabMemory[tab] = name; }
    }
    scrollTop();
  };

  /* ---------------------- 브라우저 뒤로가기 ---------------------- */
  window.addEventListener('popstate', () => {
    if (!router.back()) {
      /* 루트에서 뒤로가면 홈으로 */
      const cur = router.getCurrent();
      if (cur && cur.name !== 'home') router.go('home');
    }
  });

  /* ---------------------- 앱 시작 ---------------------- */
  /**
   * 딥링크 : index.html#state=personalized | #route=recommend
   * 프로토타입 확인/공유용. (예: QA, 데모)
   */
  function handleDeepLink() {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return false;
    const q = new URLSearchParams(hash);
    const stateParam = q.get('state');
    const route = q.get('route');
    if (stateParam === 'growing' || stateParam === 'personalized') {
      store.seedDemo(stateParam);
      router.reset('home');
      return true;
    }
    if (stateParam === 'new') {
      store.resetAll();
      if (HHC.resetOnboarding) HHC.resetOnboarding();
      router.reset('intro');
      return true;
    }
    if (route && router.getCurrent) {
      tabbar.setActive(route === 'course-detail' ? 'recommend' : route);
      router.reset(route, q.get('course') ? { course: q.get('course') } : {});
      return true;
    }
    return false;
  }

  function boot() {
    /* 저장된 테마 적용 */
    theme.apply(store.get().prefs);
    tabbar.render();
    bindGlobalDelegation();

    /* 딥링크가 있으면 그 지점으로 진입 (#state= / #route=) */
    if (handleDeepLink()) {
      store.subscribe((s) => { theme.apply(s.prefs); });
      return;
    }

    /* 첫 진입 : 스플래시 → (프로필 있으면 홈 / 없으면 소개) */
    router.reset('splash');

    /* 상태 변경 시 (테마 외) 필요한 재렌더는 각 화면이 담당.
       여기서는 prefs 변경만 테마에 반영 */
    store.subscribe((s) => { theme.apply(s.prefs); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
