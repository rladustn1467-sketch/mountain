/* ==========================================================================
   SCREEN — 마이 / 프로필 / 설정
   --------------------------------------------------------------------------
   디자인 시스템 토큰을 실시간으로 바꿀 수 있는 "디자인 시스템 콘솔"을 포함합니다.
   ========================================================================== */
(function () {
  const { ui, router, store, theme } = HHC;
  const U = store.utils;

  const THEMES = [
    { id: 'default', name: 'Forest Green', desc: '자연 그린 · 기본', swatch: 'linear-gradient(135deg,#2f7558,#5aa987)' },
    { id: 'deep-forest', name: 'Deep Forest', desc: '더 어둡고 프리미엄', swatch: 'linear-gradient(135deg,#1a4f3b,#368a66)' },
    { id: 'navy-trail', name: 'Navy Trail', desc: '네이비 + 그린 포인트', swatch: 'linear-gradient(135deg,#1d304f,#3f8f6d)' },
    { id: 'slate', name: 'Slate Minimal', desc: '차분한 미니멀 + 틸', swatch: 'linear-gradient(135deg,#294643,#6b8b87)' },
    { id: 'midnight', name: 'Midnight', desc: '다크 모드', swatch: 'linear-gradient(135deg,#0d1512,#45b086)' }
  ];

  const PRIMARY_SWATCHES = [
    { v: null, label: '기본', css: 'linear-gradient(135deg,#2f7558,#5aa987)' },
    { v: '#256b4a', label: '짙은 그린', css: '#256b4a' },
    { v: '#1f7a6b', label: '틸 그린', css: '#1f7a6b' },
    { v: '#2f4a7d', label: '네이비', css: '#2f4a7d' },
    { v: '#3b6ea5', label: '블루', css: '#3b6ea5' },
    { v: '#6b7a3f', label: '올리브', css: '#6b7a3f' },
    { v: '#8a5a2b', label: '브라운', css: '#8a5a2b' }
  ];

  const SECONDARY_SWATCHES = [
    { v: null, label: '기본', css: 'linear-gradient(135deg,#235c9e,#7fb0e3)' },
    { v: '#2f73bf', label: '트레킹 블루', css: '#2f73bf' },
    { v: '#0f8b8d', label: '틸', css: '#0f8b8d' },
    { v: '#7a5cbf', label: '퍼플', css: '#7a5cbf' },
    { v: '#c46a2b', label: '앰버', css: '#c46a2b' }
  ];

  function expLabel(v) { return (HHC.ONBOARDING.experience.find((o) => o.value === v) || {}).title || '—'; }
  function prefLabel(v) { return (HHC.ONBOARDING.preference.find((o) => o.value === v) || {}).title || '—'; }
  function goalLabel(v) { return (HHC.ONBOARDING.goal.find((o) => o.value === v) || {}).title || '—'; }
  function planLabel(v) { return (HHC.ONBOARDING.plan.find((o) => o.value === v) || {}).title || '—'; }

  router.register('profile', {
    render() {
      const state = store.get();
      const profile = state.profile || {};
      const prefs = state.prefs;
      const stats = store.getStats();
      const initial = (profile.name || '산').trim().charAt(0);

      return `<section class="screen">
        <header class="topbar"><span class="topbar__title">마이</span></header>
        <div class="screen__body screen__body--notitle">

          <div class="profile-card">
            <div class="profile-card__avatar">${HHC.esc(initial)}</div>
            <div class="grow">
              <div class="profile-card__name">${HHC.esc(profile.name || '산행러')}</div>
              <div class="profile-card__meta">${[expLabel(profile.experience), prefLabel(profile.preference), goalLabel(profile.goal)].filter((x) => x !== '—').join(' · ') || '프로필 정보 없음'}</div>
            </div>
          </div>

          <!-- 현재 개인화 단계 -->
          <div class="card">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-layer-group"></i> 개인화 단계</h2>
              <p class="card__sub">산행 데이터가 쌓일수록 서비스가 진화합니다</p></div>
            </div>
            <div class="stack-3">
              <div class="between" style="opacity:${stats.stage === 'new' ? 1 : .55}">
                <span style="font-size:var(--fs-sm)"><i class="fa-solid fa-seedling" style="color:var(--color-text-faint)"></i> ① 신규 사용자 · 데이터 없음</span>
                ${stats.stage === 'new' ? '<span class="chip chip--sm chip--active">현재</span>' : '<i class="fa-solid fa-check" style="color:var(--color-primary)"></i>'}
              </div>
              <div class="between" style="opacity:${stats.stage === 'growing' ? 1 : .55}">
                <span style="font-size:var(--fs-sm)"><i class="fa-solid fa-database" style="color:var(--color-text-faint)"></i> ② 데이터 축적 중 (1~2회)</span>
                ${stats.stage === 'growing' ? '<span class="chip chip--sm chip--active">현재</span>' : (stats.stage === 'personalized' ? '<i class="fa-solid fa-check" style="color:var(--color-primary)"></i>' : '')}
              </div>
              <div class="between" style="opacity:${stats.stage === 'personalized' ? 1 : .55}">
                <span style="font-size:var(--fs-sm)"><i class="fa-solid fa-fingerprint" style="color:var(--color-text-faint)"></i> ③ 개인화 활성화 (3회+)</span>
                ${stats.stage === 'personalized' ? '<span class="chip chip--sm chip--active">현재</span>' : ''}
              </div>
            </div>
            <div class="bar bar--thin" style="margin-top:var(--sp-4)">
              <span style="width:${Math.min(100, stats.count / 3 * 100)}%"></span>
            </div>
            <div class="bar-meta"><span>${stats.count} / 3회</span><span>개인화 활성화까지</span></div>
          </div>

          <!-- ================= 디자인 시스템 콘솔 ================= -->
          <section class="card" style="border-color:var(--color-primary-200)">
            <div class="card__head" style="margin-bottom:var(--sp-4)">
              <div>
                <span class="ai-badge"><i class="fa-solid fa-palette"></i>디자인 시스템</span>
                <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-md)">테마 · 컬러를 즉시 변경</h2>
                <p class="card__sub">여기서 바꾸면 앱 전체 UI(버튼 · 카드 · 그래프 · 내비)가 함께 바뀝니다</p>
              </div>
            </div>

            <div class="stack-4">
              <div class="setting-group">
                <span class="setting-label">1. 테마 프리셋</span>
                <div class="theme-grid">
                  ${THEMES.map((t) => `<button class="theme-opt" data-theme-opt="${t.id}" aria-pressed="${prefs.theme === t.id}">
                    <span class="theme-opt__swatch" style="background:${t.swatch}"></span>
                    <span><span class="theme-opt__name">${t.name}</span><span class="theme-opt__desc">${t.desc}</span></span>
                  </button>`).join('')}
                </div>
              </div>

              <div class="setting-group">
                <span class="setting-label">2. Primary 색상</span>
                <span class="setting-desc">브랜드 메인 컬러 (자연 그린 계열 권장)</span>
                <div class="swatch-row">
                  ${PRIMARY_SWATCHES.map((s) => `<button class="swatch" data-primary="${s.v || ''}" title="${s.label}" aria-label="${s.label}" aria-pressed="${(prefs.customPrimary || '') === (s.v || '')}" style="background:${s.css}"></button>`).join('')}
                </div>
              </div>

              <div class="setting-group">
                <span class="setting-label">3. Secondary 색상</span>
                <span class="setting-desc">보조 컬러 (날씨 카드 · 데이터 강조)</span>
                <div class="swatch-row">
                  ${SECONDARY_SWATCHES.map((s) => `<button class="swatch" data-secondary="${s.v || ''}" title="${s.label}" aria-label="${s.label}" aria-pressed="${(prefs.customSecondary || '') === (s.v || '')}" style="background:${s.css}"></button>`).join('')}
                </div>
              </div>

              <div class="setting-group">
                <span class="setting-label">4. 버튼 형태 (radius)</span>
                <div class="segment" id="btn-shape">
                  <button class="segment__btn" data-shape="pill" aria-pressed="${prefs.buttonShape === 'pill'}">Pill</button>
                  <button class="segment__btn" data-shape="rounded" aria-pressed="${prefs.buttonShape === 'rounded'}">Rounded</button>
                  <button class="segment__btn" data-shape="square" aria-pressed="${prefs.buttonShape === 'square'}">Square</button>
                </div>
                <div class="btn-row" style="margin-top:var(--sp-3)">
                  <button class="btn btn--primary">Primary 버튼</button>
                  <button class="btn btn--outline">Outline</button>
                </div>
              </div>

              <div class="setting-group">
                <span class="setting-label">5. 카드 스타일 미리보기</span>
                <div class="stack-2">
                  <div class="card card--ai" style="padding:var(--sp-4)"><span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>AI 추천</span>
                    <p style="margin-top:8px;font-size:var(--fs-sm);color:rgba(255,255,255,.9)">핵심 기능 강조 카드</p></div>
                  <div class="card card--weather" style="padding:var(--sp-4)"><strong style="font-size:var(--fs-sm)"><i class="fa-solid fa-cloud-sun"></i> 날씨 카드</strong></div>
                  <div class="card card--warm" style="padding:var(--sp-4)"><strong style="font-size:var(--fs-sm)"><i class="fa-solid fa-suitcase-rolling"></i> 준비 가이드 카드</strong></div>
                </div>
              </div>

              <button class="btn btn--ghost btn--block btn--sm" data-nav="reset-theme"><i class="fa-solid fa-rotate-left"></i> 테마 기본값으로 초기화</button>
            </div>
          </section>

          <!-- 프로필 수정 -->
          <section class="card">
            <div class="card__head" style="margin-bottom:var(--sp-4)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-user-pen"></i> 프로필 수정</h2></div>
            </div>
            <div class="stack-4">
              <div class="field"><label class="field__label" for="pf-name">이름</label>
                <input class="input" id="pf-name" value="${HHC.esc(profile.name || '')}" maxlength="12"></div>
              <div class="field"><label class="field__label">등산 경험</label>
                <div class="chip-row" id="pf-exp">
                  ${HHC.ONBOARDING.experience.map((o) => `<button class="chip ${profile.experience === o.value ? 'chip--active' : ''}" data-exp="${o.value}">${o.emoji} ${o.title}</button>`).join('')}
                </div></div>
              <div class="field"><label class="field__label">선호 난이도</label>
                <div class="chip-row" id="pf-pref">
                  ${HHC.ONBOARDING.preference.map((o) => `<button class="chip ${profile.preference === o.value ? 'chip--active' : ''}" data-pref="${o.value}">${o.emoji} ${o.title}</button>`).join('')}
                </div></div>
              <div class="field"><label class="field__label">산행 목표</label>
                <div class="chip-row" id="pf-goal">
                  ${HHC.ONBOARDING.goal.map((o) => `<button class="chip ${profile.goal === o.value ? 'chip--active' : ''}" data-goalopt="${o.value}">${o.emoji} ${o.title}</button>`).join('')}
                </div></div>
              <div class="field"><label class="field__label">다음 산행 예정</label>
                <div class="chip-row" id="pf-plan">
                  ${HHC.ONBOARDING.plan.map((o) => `<button class="chip ${profile.plan === o.value ? 'chip--active' : ''}" data-planopt="${o.value}">${o.emoji} ${o.title}</button>`).join('')}
                </div></div>
              <div class="btn-row">
                <button class="btn btn--outline" data-go="onboard" data-fresh="1">온보딩 다시하기</button>
                <button class="btn btn--primary" data-nav="save-profile"><i class="fa-solid fa-check"></i> 저장</button>
              </div>
            </div>
          </section>

          <!-- 데이터 관리 -->
          <section class="card">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-database"></i> 데이터 관리</h2></div>
            </div>
            <div class="stack-2">
              <button class="row" data-go="records">
                <span class="row__icon"><i class="fa-solid fa-chart-simple"></i></span>
                <span class="row__main"><span class="row__title">산행 기록</span><span class="row__sub">${stats.count}회 저장됨</span></span>
                <span class="row__tail"><i class="fa-solid fa-chevron-right"></i></span>
              </button>
              <div class="between card card--inset" style="padding:var(--sp-4)">
                <div><div style="font-size:var(--fs-sm);font-weight:var(--fw-semibold)">알림 (산행 리마인더)</div>
                  <div class="setting-desc">평소 산행 주기에 맞춰 알림 (프로토타입)</div></div>
                <button class="chip ${prefs.notifications ? 'chip--active' : 'chip--outline'}" data-nav="toggle-noti">${prefs.notifications ? 'ON' : 'OFF'}</button>
              </div>
            </div>
            <button class="btn btn--block btn--sm" style="margin-top:var(--sp-4);color:var(--color-danger);border:1.5px solid currentColor;border-radius:var(--radius-btn)" data-nav="reset-all">
              <i class="fa-solid fa-trash-can"></i> 모든 데이터 초기화 (신규 사용자로 되돌리기)
            </button>
            <p class="setting-desc" style="margin-top:8px;text-align:center">초기화하면 프로필과 산행 기록이 모두 삭제되고 온보딩부터 다시 시작합니다.</p>
          </section>

          <!-- 프로토타입 체험용 데모 데이터 -->
          <section class="card card--inset">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-flask"></i> 프로토타입 체험</h2>
              <p class="card__sub">3단계 UX 상태를 즉시 전환해 확인할 수 있습니다</p></div>
            </div>
            <div class="stack-2">
              <button class="row" data-nav="demo" data-kind="growing">
                <span class="row__icon"><i class="fa-solid fa-seedling"></i></span>
                <span class="row__main"><span class="row__title">데모 데이터 2회 생성</span><span class="row__sub">상태 ② 데이터 축적 중 · 기본 AI 분석</span></span>
                <span class="row__tail"><i class="fa-solid fa-chevron-right"></i></span>
              </button>
              <button class="row" data-nav="demo" data-kind="personalized">
                <span class="row__icon"><i class="fa-solid fa-fingerprint"></i></span>
                <span class="row__main"><span class="row__title">데모 데이터 6회 생성</span><span class="row__sub">상태 ③ 개인화 활성화 · 산행 주기 23일</span></span>
                <span class="row__tail"><i class="fa-solid fa-chevron-right"></i></span>
              </button>
            </div>
            <p class="setting-desc" style="margin-top:10px">데모 기록은 실제 기록과 동일하게 계산되어 모든 통계 · AI 분석 · 추천에 반영됩니다.</p>
          </section>

          <div class="card card--inset">
            <div class="inline" style="gap:var(--sp-3);align-items:flex-start">
              <i class="fa-solid fa-lock" style="color:var(--color-primary);margin-top:3px"></i>
              <p class="text-muted" style="font-size:var(--fs-xs);line-height:var(--lh-loose)">
                이 앱은 프로토타입입니다. 입력한 정보와 산행 기록은 <strong>브라우저 localStorage</strong>에만 저장되며 서버로 전송되지 않습니다.
              </p>
            </div>
          </div>

          <p class="center text-faint" style="font-size:var(--fs-2xs)">AI Hiking Health Coach · Prototype v1.0</p>
        </div>
      </section>`;
    },

    mount(el) {
      const prefs = store.get().prefs;

      /* 테마 프리셋 */
      el.querySelectorAll('[data-theme-opt]').forEach((b) => {
        b.addEventListener('click', () => {
          store.setPref('theme', b.dataset.themeOpt);
          HHC.theme.apply(store.get().prefs);
          el.querySelectorAll('[data-theme-opt]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          HHC.toast(`테마 변경 · ${THEMES.find((t) => t.id === b.dataset.themeOpt).name}`, 'fa-palette');
        });
      });

      /* Primary 색상 */
      el.querySelectorAll('[data-primary]').forEach((b) => {
        b.addEventListener('click', () => {
          store.setPref('customPrimary', b.dataset.primary || null);
          HHC.theme.apply(store.get().prefs);
          el.querySelectorAll('[data-primary]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          HHC.toast('Primary 색상을 변경했습니다 (앱 전체 반영)', 'fa-droplet');
        });
      });

      /* Secondary 색상 */
      el.querySelectorAll('[data-secondary]').forEach((b) => {
        b.addEventListener('click', () => {
          store.setPref('customSecondary', b.dataset.secondary || null);
          HHC.theme.apply(store.get().prefs);
          el.querySelectorAll('[data-secondary]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          HHC.toast('Secondary 색상을 변경했습니다', 'fa-droplet');
        });
      });

      /* 버튼 형태 */
      el.querySelectorAll('[data-shape]').forEach((b) => {
        b.addEventListener('click', () => {
          store.setPref('buttonShape', b.dataset.shape);
          HHC.theme.apply(store.get().prefs);
          el.querySelectorAll('[data-shape]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        });
      });

      /* 프로필 칩 */
      const chipHandler = (sel, key) => {
        el.querySelectorAll(sel).forEach((b) => {
          b.addEventListener('click', () => {
            const val = b.dataset[key];
            store.saveProfile({ [key === 'exp' ? 'experience' : key === 'pref' ? 'preference' : key === 'goalopt' ? 'goal' : 'plan']: val });
            el.querySelectorAll(sel).forEach((x) => x.classList.toggle('chip--active', x === b));
            HHC.toast('프로필이 업데이트되었습니다 · 추천에 반영됩니다', 'fa-check');
          });
        });
      };
      chipHandler('[data-exp]', 'exp');
      chipHandler('[data-pref]', 'pref');
      chipHandler('[data-goalopt]', 'goalopt');
      chipHandler('[data-planopt]', 'planopt');

      /* 저장 */
      el.querySelector('[data-nav="save-profile"]').addEventListener('click', () => {
        const name = el.querySelector('#pf-name').value.trim();
        store.saveProfile({ name: name || '산행러' });
        HHC.toast('프로필을 저장했습니다', 'fa-check');
        router.replace('profile');
      });

      /* 알림 토글 */
      el.querySelector('[data-nav="toggle-noti"]').addEventListener('click', (e) => {
        const next = !store.get().prefs.notifications;
        store.setPref('notifications', next);
        e.currentTarget.classList.toggle('chip--active', next);
        e.currentTarget.classList.toggle('chip--outline', !next);
        e.currentTarget.textContent = next ? 'ON' : 'OFF';
      });

      /* 테마 초기화 */
      el.querySelector('[data-nav="reset-theme"]').addEventListener('click', () => {
        store.setPref('theme', 'default');
        store.setPref('customPrimary', null);
        store.setPref('customSecondary', null);
        store.setPref('buttonShape', 'pill');
        HHC.theme.apply(store.get().prefs);
        HHC.toast('테마를 기본값으로 되돌렸습니다', 'fa-rotate-left');
        router.replace('profile');
      });

      /* 전체 초기화 */
      el.querySelector('[data-nav="reset-all"]').addEventListener('click', () => {
        if (confirm('모든 데이터를 삭제하고 신규 사용자 상태로 되돌립니다. 계속할까요?')) {
          store.resetAll();
          HHC.theme.apply(store.get().prefs);
          if (HHC.resetOnboarding) HHC.resetOnboarding();
          HHC.toast('모든 데이터를 초기화했습니다', 'fa-trash-can');
          router.reset('intro');
        }
      });

      /* 데모 데이터 생성 */
      el.querySelectorAll('[data-nav="demo"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const kind = btn.dataset.kind;
          store.seedDemo(kind);
          HHC.toast(kind === 'personalized'
            ? '개인화 단계 데모 데이터를 생성했습니다'
            : '데이터 축적 단계 데모 데이터를 생성했습니다', 'fa-flask');
          router.go('home');
        });
      });
    }
  });
})();
