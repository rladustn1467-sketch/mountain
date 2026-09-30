/* ==========================================================================
   SCREENS — Splash / 서비스 소개 / 온보딩 / 기본 정보 / 첫 산행 추천
   ========================================================================== */
(function () {
  const { ui, router, store } = HHC;

  /* ------------------------------------------------------------------
     1. SPLASH
     ------------------------------------------------------------------ */
  router.register('splash', {
    render() {
      const recs = store.get().records;
      return `<section class="screen">
        <div class="splash">
          <div class="splash__logo"><i class="fa-solid fa-mountain"></i></div>
          <h1 class="splash__title">AI Hiking<br>Health Coach</h1>
          <p class="splash__sub">산행할 때마다 AI가 당신의 패턴을 학습하고,<br>다음 산행을 더 정교하게 추천합니다.</p>
          <div class="splash__loop">
            <b>산행 기록</b><i class="fa-solid fa-arrow-right"></i>
            <b>AI 분석</b><i class="fa-solid fa-arrow-right"></i>
            <b>패턴 학습</b><i class="fa-solid fa-arrow-right"></i>
            <b>다음 추천</b>
          </div>
          <div class="splash__peaks">
            ${HHC.ridgeSvg('rgba(255,255,255,0.13)')}
          </div>
        </div>
      </section>`;
    },
    mount(el) {
      /* 스플래시 → 1.6s 후 자동 진행 (기존 사용자는 홈으로) */
      const hasProfile = !!store.get().profile;
      setTimeout(() => {
        if (!router.canGoBack() && router.getCurrent().name === 'splash') {
          router.replace(hasProfile ? 'home' : 'intro');
        }
      }, 1700);
      const splash = el.querySelector('.splash');
      splash.addEventListener('click', () => {
        if (router.getCurrent().name === 'splash') {
          router.replace(hasProfile ? 'home' : 'intro');
        }
      });
    }
  });

  /* ------------------------------------------------------------------
     2. 서비스 소개
     ------------------------------------------------------------------ */
  router.register('intro', {
    render() {
      const recs = store.get().records;
      const stats = store.getStats();
      return `<section class="screen">
        <div class="screen__body screen__body--notitle">
          <div class="hero" style="min-height:250px">
            <img class="hero__img" src="${HHC.IMAGES.ridge}" alt="안개 낀 산 능선 풍경">
            <div class="hero__eyebrow">환영합니다</div>
            <h1 class="hero__title">매주 산에 가야 하는 앱이<br>아닙니다.</h1>
            <p class="hero__desc">실제로 산에 갈 때마다 데이터를 학습해<br>다음 산행을 더 개인화해서 추천하는 AI 등산 코치입니다.</p>
          </div>

          <div class="card">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div>
                <span class="ai-badge"><i class="fa-solid fa-arrows-spin"></i>지속적 개인화 순환</span>
              </div>
            </div>
            <ol class="algo-steps">
              <li class="algo-step"><span class="algo-step__dot"><i class="fa-solid fa-person-hiking"></i></span>
                <div><div class="algo-step__label">산행 기록</div><div class="algo-step__value">거리 · 시간 · 고도 · 페이스를 축적</div></div></li>
              <li class="algo-step"><span class="algo-step__dot"><i class="fa-solid fa-brain"></i></span>
                <div><div class="algo-step__label">AI 분석</div><div class="algo-step__value">이전 기록과 비교해 변화와 개선점 도출</div></div></li>
              <li class="algo-step"><span class="algo-step__dot"><i class="fa-solid fa-fingerprint"></i></span>
                <div><div class="algo-step__label">사용자 패턴 학습</div><div class="algo-step__value">산행 주기 · 평균 거리 · 선호 난이도 학습</div></div></li>
              <li class="algo-step"><span class="algo-step__dot"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                <div><div class="algo-step__label">다음 산행 추천</div><div class="algo-step__value">날씨와 컨디션까지 반영한 맞춤 코스</div></div></li>
            </ol>
          </div>

          <div class="card card--inset">
            <p style="font-size:var(--fs-sm);line-height:var(--lh-loose);color:var(--color-text-muted)">
              처음에는 <strong style="color:var(--color-text)">간단한 정보만</strong> 알려주세요.<br>
              산행할수록 AI가 당신의 산행 패턴을 배웁니다.
            </p>
            ${stats.hasData
              ? ui.notice(`이미 <strong>${stats.count}회</strong>의 산행 기록이 저장되어 있습니다. 바로 홈으로 이동할 수 있습니다.`, 'muted', 'fa-database')
              : `<div class="pipeline" style="margin-top:var(--sp-3)">
                   <b>온보딩</b><i class="fa-solid fa-chevron-right"></i>
                   <b>첫 산행 추천</b><i class="fa-solid fa-chevron-right"></i>
                   <span>홈</span>
                 </div>`}
          </div>

          <div class="btn-row">
            <button class="btn btn--ghost" data-go="onboard" data-fresh="1">처음부터 시작</button>
            <button class="btn btn--primary" data-go="onboard">${stats.hasData ? '온보딩 다시 하기' : '시작하기'}</button>
          </div>
          <p class="center text-faint" style="font-size:var(--fs-2xs)">프로토타입 · 입력 정보는 브라우저에만 저장되며 외부로 전송되지 않습니다</p>
        </div>
      </section>`;
    }
  });

  /* ------------------------------------------------------------------
     3. ONBOARDING — Q1~Q4 + 기본 정보
     ------------------------------------------------------------------ */
  const draft = {};
  let stepIndex = 0;

  const STEPS = [
    { key: 'experience', q: '등산 경험은 어느 정도인가요?', hint: '경험 수준에 따라 첫 산행 난이도를 조정합니다.', options: () => HHC.ONBOARDING.experience },
    { key: 'preference', q: '보통 어떤 산행을 선호하나요?', hint: '선호 난이도는 코스 추천 스코어에 반영됩니다.', options: () => HHC.ONBOARDING.preference },
    { key: 'goal', q: '이번에 산행할 목적은 무엇인가요?', hint: '목표에 따라 코스와 페이스 가이드가 달라집니다.', options: () => HHC.ONBOARDING.goal },
    { key: 'plan', q: '다음 산행은 언제쯤 예정되어 있나요?', hint: '산행 예정 시점에 맞춰 날씨와 난이도를 계산합니다.', options: () => HHC.ONBOARDING.plan },
    { key: 'body', q: '마지막으로 기본 정보만 알려주세요', hint: '칼로리와 운동 강도 계산에 사용됩니다. 나중에 설정에서 바꿀 수 있어요.', options: null }
  ];

  function stepHtml(step, value) {
    const head = `<div class="onboard__progress">
      ${STEPS.map((s, i) => `<span class="${i <= stepIndex ? 'done' : ''}"></span>`).join('')}
    </div>
    <div>
      <div class="onboard__step">STEP ${stepIndex + 1} / ${STEPS.length}</div>
      <h1 class="onboard__q" style="margin-top:6px">${step.q}</h1>
      <p class="onboard__hint" style="margin-top:8px">${step.hint}</p>
    </div>`;

    if (step.options) {
      const opts = step.options();
      return `<div class="onboard">${head}
        <div class="option-list">
          ${opts.map((o) => `<button class="option" data-value="${o.value}" aria-pressed="${value === o.value}">
            <span class="option__emoji">${o.emoji}</span>
            <span class="option__main"><span class="option__title">${o.title}</span>
            <span class="option__desc">${o.desc}</span></span>
            <i class="fa-solid fa-circle-check option__check"></i>
          </button>`).join('')}
        </div>
        <div class="onboard__foot">
          <div class="btn-row">
            ${stepIndex > 0 ? `<button class="btn btn--ghost" data-nav="back">이전</button>` : ''}
            <button class="btn btn--primary" data-nav="next" ${value ? '' : 'disabled style="opacity:.5"'}>다음</button>
          </div>
        </div>
      </div>`;
    }

    /* 기본 정보 입력 */
    return `<div class="onboard">${head}
      <div class="stack-4">
        <div class="field"><label class="field__label" for="ob-name">이름 (또는 닉네임)</label>
          <input class="input" id="ob-name" placeholder="산행러" value="${HHC.esc(draft.name || '')}" maxlength="12"></div>
        <div class="field"><label class="field__label" for="ob-age">나이</label>
          <input class="input" id="ob-age" type="number" inputmode="numeric" placeholder="35" value="${draft.age || ''}"></div>
        <div class="field"><label class="field__label">성별</label>
          <div class="segment" id="ob-gender">
            <button class="segment__btn" data-gender="male" aria-pressed="${draft.gender === 'male'}">남성</button>
            <button class="segment__btn" data-gender="female" aria-pressed="${draft.gender === 'female'}">여성</button>
            <button class="segment__btn" data-gender="none" aria-pressed="${draft.gender === 'none' || !draft.gender}">선택 안 함</button>
          </div></div>
        <div class="field"><label class="field__label" for="ob-weight">체중 (kg)</label>
          <input class="input" id="ob-weight" type="number" inputmode="numeric" placeholder="68" value="${draft.weight || ''}"></div>
        <div class="field"><label class="field__label" for="ob-height">신장 (cm)</label>
          <input class="input" id="ob-height" type="number" inputmode="numeric" placeholder="172" value="${draft.height || ''}"></div>
        <div class="field"><label class="field__label" for="ob-wearable">웨어러블 연동</label>
          <select class="input" id="ob-wearable">
            <option value="none">연동 안 함</option>
            <option value="apple">Apple Watch</option>
            <option value="garmin">Garmin</option>
            <option value="fitbit">Fitbit</option>
            <option value="samsung">Galaxy Watch</option>
          </select>
          <span class="setting-desc">프로토타입에서는 실제 연동 없이 시뮬레이션됩니다.</span></div>
      </div>
      <div class="onboard__foot">
        ${ui.notice('모든 항목은 선택 사항입니다. 비워두면 기본값으로 추천합니다.', 'muted', 'fa-lock')}
        <div class="btn-row">
          <button class="btn btn--ghost" data-nav="back">이전</button>
          <button class="btn btn--primary" data-nav="next">${stepIndex === STEPS.length - 1 ? '첫 산행 추천 받기' : '다음'}</button>
        </div>
      </div>
    </div>`;
  }

  router.register('onboard', {
    render() {
      const step = STEPS[stepIndex];
      const value = draft[step.key];
      return `<section class="screen"><div class="screen__body screen__body--notitle" style="padding-bottom:var(--sp-5)">
        ${stepHtml(step, value)}
      </div></section>`;
    },
    mount(el) {
      const step = STEPS[stepIndex];

      el.querySelectorAll('[data-value]').forEach((btn) => {
        btn.addEventListener('click', () => {
          draft[step.key] = btn.dataset.value;
          el.querySelectorAll('[data-value]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          const next = el.querySelector('[data-nav="next"]');
          if (next) { next.disabled = false; next.style.opacity = ''; }
          /* 자동 진행 */
          setTimeout(() => advance(el), 220);
        });
      });

      const gender = el.querySelector('#ob-gender');
      if (gender) {
        gender.querySelectorAll('[data-gender]').forEach((b) => {
          b.addEventListener('click', () => {
            draft.gender = b.dataset.gender;
            gender.querySelectorAll('[data-gender]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          });
        });
      }

      el.querySelectorAll('[data-nav]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.dataset.nav === 'back') {
            if (stepIndex > 0) { stepIndex--; router.replace('onboard'); }
            else router.replace('intro');
          } else {
            captureBody(el);
            advance(el);
          }
        });
      });
    }
  });

  function captureBody(el) {
    const name = el.querySelector('#ob-name');
    if (!name) return;
    draft.name = name.value.trim();
    draft.age = Number(el.querySelector('#ob-age').value) || null;
    draft.weight = Number(el.querySelector('#ob-weight').value) || null;
    draft.height = Number(el.querySelector('#ob-height').value) || null;
    draft.wearable = el.querySelector('#ob-wearable').value;
    if (!draft.gender) draft.gender = 'none';
  }

  function advance(el) {
    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      router.replace('onboard');
    } else {
      captureBody(el);
      /* 프로필 저장 → 첫 산행 추천 화면 */
      store.saveProfile({
        name: draft.name || '산행러',
        age: draft.age, weight: draft.weight, height: draft.height,
        gender: draft.gender || 'none', wearable: draft.wearable || 'none',
        experience: draft.experience, preference: draft.preference,
        goal: draft.goal, plan: draft.plan
      });
      router.replace('first-recommend');
    }
  }

  HHC.resetOnboarding = function () { stepIndex = 0; Object.keys(draft).forEach((k) => delete draft[k]); };

  /* ------------------------------------------------------------------
     4. 첫 산행 추천 (신규 사용자 전용)
     ------------------------------------------------------------------ */
  router.register('first-recommend', {
    render() {
      const rec = store.recommendNext();
      const p = store.get().profile || {};
      const course = rec.courses[0];
      const expLabel = (HHC.ONBOARDING.experience.find((o) => o.value === p.experience) || {}).title || '입력 정보';
      const prefLabel = (HHC.ONBOARDING.preference.find((o) => o.value === p.preference) || {}).title || '선호도';
      return `<section class="screen">
        <div class="topbar"><span class="topbar__title"></span></div>
        <div class="screen__body screen__body--notitle">
          <div class="center stack-2" style="padding:var(--sp-4) 0">
            <div class="empty__icon" style="margin:0 auto"><i class="fa-solid fa-seedling"></i></div>
            <h1 class="hero__title" style="color:var(--color-text);font-size:var(--fs-2xl)">첫 산행을 준비했어요</h1>
            <p class="text-muted" style="font-size:var(--fs-sm)">아직 산행 기록이 없어 <strong style="color:var(--color-text)">입력 정보 + 코스 정보 + 날씨 + AI 분석</strong>으로 추천했습니다.</p>
          </div>

          <div class="card card--ai">
            <div class="card__head">
              <div>
                <span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>첫 산행 추천</span>
                <h2 class="card__title" style="margin-top:10px">${HHC.esc(course.name)}</h2>
                <p class="card__sub">${course.distance.toFixed(1)} km · 약 ${store.utils.fmtDur(course.duration * 60)} · ${HHC.LEVELS[course.level].label}</p>
              </div>
            </div>
            <div class="input-chips">
              <span class="input-chip"><i class="fa-solid fa-route"></i>${expLabel}</span>
              <span class="input-chip"><i class="fa-solid fa-sliders"></i>${prefLabel}</span>
              <span class="input-chip"><i class="fa-solid fa-cloud-sun"></i>${rec.weather.condition} ${rec.weather.tempMin}~${rec.weather.tempMax}°C</span>
            </div>
            <p style="font-size:var(--fs-sm);color:rgba(255,255,255,.9);margin-top:var(--sp-4);line-height:var(--lh-normal)">
              ${course.reasonText}
            </p>
            <div style="margin-top:var(--sp-4)">${HHC.charts.elevation(course.elevation)}</div>
            <button class="btn btn--white btn--block" style="margin-top:var(--sp-4)" data-go="course-detail" data-course="${course.id}">
              코스 자세히 보기 <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          ${ui.notice('산행을 완료하면 AI가 첫 기록을 분석해 <strong>다음 추천부터 개인화</strong>가 시작됩니다.', '', 'fa-circle-info')}

          <div class="btn-row">
            <button class="btn btn--outline" data-go="home">홈으로</button>
            <button class="btn btn--primary" data-go="hiking-setup" data-course="${course.id}">이 코스로 산행 시작</button>
          </div>
        </div>
      </section>`;
    }
  });
})();
