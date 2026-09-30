/* ==========================================================================
   UI KIT — 재사용 컴포넌트 빌더 + 라우터 + 테마 적용
   화면 코드는 여기 헬퍼만 조합해서 마크업을 만듭니다.
   ========================================================================== */
window.HHC = window.HHC || {};

/* ------------------------------ helpers ------------------------------ */
HHC.h = function h(strings) { return strings; }; // (미사용, 템플릿 리터럴 사용)

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
HHC.esc = esc;

/* ------------------------------ UI builders ------------------------------ */
HHC.ui = (function () {
  const U = HHC.store.utils;

  function levelChip(level) {
    const L = HHC.LEVELS[level] || HHC.LEVELS[2];
    return `<span class="difficulty" data-level="${L.key}"><i class="fa-solid fa-signal"></i>${L.label}</span>`;
  }

  /* 섹션 헤더 */
  function sectionHead(title, action) {
    return `<div class="section__head">
      <h2 class="section__title">${title}</h2>
      ${action || ''}
    </div>`;
  }

  /* 통계 타일 */
  function stat(label, value, unit, delta) {
    return `<div class="stat">
      <span class="stat__label">${label}</span>
      <span class="stat__value num">${value}${unit ? `<small>${unit}</small>` : ''}</span>
      ${delta || ''}
    </div>`;
  }

  function delta(value, suffix, goodWhenUp) {
    const up = value > 0.5, down = value < -0.5;
    const cls = (!up && !down) ? 'delta-flat' : ((up === (goodWhenUp !== false)) ? 'delta-up' : 'delta-down');
    const icon = up ? 'fa-arrow-trend-up' : down ? 'fa-arrow-trend-down' : 'fa-minus';
    return `<span class="stat__delta ${cls}"><i class="fa-solid ${icon}"></i>${Math.abs(value).toFixed(0)}${suffix}</span>`;
  }

  /* 코스 카드 */
  function courseCard(course, opts) {
    opts = opts || {};
    const U2 = HHC.store.utils;
    const img = HHC.IMAGES[course.image] || HHC.IMAGES.ridge;
    return `<button class="course-card ${opts.highlight ? 'course-card--pick' : ''}" data-go="course-detail" data-course="${course.id}" aria-label="${esc(course.name)} 상세 보기">
      <div class="course-card__media">
        <img src="${img}" alt="${esc(course.region)} 등산로 풍경" loading="lazy">
        ${opts.rankBadge ? `<span class="rank-badge">${opts.rankBadge}</span>` : ''}
        <div class="course-card__overlay">
          <div>
            <div class="course-card__name">${esc(course.name)}</div>
            <div class="course-card__region"><i class="fa-solid fa-location-dot"></i>${esc(course.region)}</div>
          </div>
        </div>
      </div>
      <div class="course-card__body">
        <div class="inline wrap" style="gap:8px">
          ${levelChip(course.level)}
          ${(course.tags || []).slice(0, 2).map((t) => `<span class="chip chip--sm">${esc(t)}</span>`).join('')}
          ${course.matched ? `<span class="chip chip--sm chip--outline"><i class="fa-solid fa-bullseye"></i>적합도 ${Math.round(Math.min(98, course.matched))}%</span>` : ''}
        </div>
        <div class="course-metrics">
          <div class="metric"><div class="metric__value num">${course.distance.toFixed(1)}</div><div class="metric__label">km</div></div>
          <div class="metric"><div class="metric__value num">${U2.fmtDur(course.duration * 60)}</div><div class="metric__label">예상 시간</div></div>
          <div class="metric"><div class="metric__value num">+${course.ascent}</div><div class="metric__label">고도(m)</div></div>
          <div class="metric"><div class="metric__value num">${course.calories}</div><div class="metric__label">kcal</div></div>
        </div>
        ${course.reasonText ? `<p class="course-reason"><strong>추천 이유</strong> · ${course.reasonText}</p>` : ''}
      </div>
    </button>`;
  }

  /* AI 카드 래퍼 */
  function aiCard(inner, opts) {
    opts = opts || {};
    return `<section class="card card--ai">
      <div class="card__head">
        <div>
          <span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>AI 분석</span>
          ${opts.title ? `<h2 class="card__title" style="margin-top:10px">${opts.title}</h2>` : ''}
          ${opts.sub ? `<p class="card__sub">${opts.sub}</p>` : ''}
        </div>
        ${opts.tail || ''}
      </div>
      ${inner}
    </section>`;
  }

  function aiPoints(points) {
    if (!points || !points.length) return '';
    return `<ul class="ai-points">${points.map((p) => `
      <li><i class="fa-solid ${p.icon}"></i><span>${p.text}</span></li>`).join('')}</ul>`;
  }

  function bar(value, max, labelRight) {
    const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
    return `<div><div class="bar"><span style="width:${pct}%"></span></div>
      ${labelRight ? `<div class="bar-meta"><span>${labelRight[0]}</span><span>${labelRight[1]}</span></div>` : ''}</div>`;
  }

  function empty(title, desc, cta) {
    return `<div class="empty">
      <div class="empty__icon"><i class="fa-solid fa-mountain-sun"></i></div>
      <h3 class="empty__title">${title}</h3>
      <p class="empty__desc">${desc}</p>
      ${cta || ''}
    </div>`;
  }

  function notice(text, kind, icon) {
    return `<div class="notice ${kind ? 'notice--' + kind : ''}">
      <i class="fa-solid ${icon || 'fa-circle-info'}"></i><span>${text}</span>
    </div>`;
  }

  function weatherStrip(w) {
    return `<div class="weather-strip">
      <div class="weather-item"><div class="weather-item__icon"><i class="fa-solid ${w.icon}"></i></div>
        <div class="weather-item__value">${w.tempMin}~${w.tempMax}°</div><div class="weather-item__label">기온</div></div>
      <div class="weather-item"><div class="weather-item__icon"><i class="fa-solid fa-droplet"></i></div>
        <div class="weather-item__value">${w.rain}%</div><div class="weather-item__label">강수</div></div>
      <div class="weather-item"><div class="weather-item__icon"><i class="fa-solid fa-wind"></i></div>
        <div class="weather-item__value">${w.wind}m/s</div><div class="weather-item__label">풍속</div></div>
      <div class="weather-item"><div class="weather-item__icon"><i class="fa-solid fa-water"></i></div>
        <div class="weather-item__value">${w.humidity}%</div><div class="weather-item__label">습도</div></div>
    </div>`;
  }

  /* AI 카드용 매트릭(어두운 배경 위) */
  function aiMetrics(items) {
    return `<div class="stat-grid stat-grid--3" style="gap:10px">
      ${items.map((it) => `<div class="stat"><span class="stat__label">${it[0]}</span>
        <span class="stat__value num" style="font-size:var(--fs-lg)">${it[1]}</span></div>`).join('')}
    </div>`;
  }

  return { levelChip, sectionHead, stat, delta, courseCard, aiCard, aiPoints, aiMetrics, bar, empty, notice, weatherStrip };
})();

/* 장식용 능선 그래픽 SVG (색 지정 가능) */
HHC.ridgeSvg = function (color) {
  const c = color || 'var(--ridge-fill)';
  return `<svg viewBox="0 0 390 90" preserveAspectRatio="none" style="width:100%;height:70px;display:block">
    <path d="M0 88 L48 44 L86 66 L134 24 L182 58 L228 30 L276 62 L322 36 L360 60 L390 46 L390 90 L0 90 Z" fill="${c}"/>
    <path d="M0 90 L62 58 L108 76 L158 42 L206 70 L252 48 L300 74 L348 52 L390 72 L390 90 Z" fill="${c}" opacity=".6"/>
  </svg>`;
};

/* ==========================================================================
   ROUTER — 화면 등록 / 이동 / 뒤로가기 스택
   ========================================================================== */
HHC.router = (function () {
  const routes = {};
  const stack = [];
  let current = null;

  function register(name, def) { routes[name] = def; }

  function go(name, params, opts) {
    opts = opts || {};
    const route = routes[name];
    if (!route) { console.warn('[router] unknown route', name); return; }
    if (current && !opts.replace) stack.push({ name: current.name, params: current.params });
    current = { name, params: params || {} };
    render();
    const view = document.getElementById('view');
    if (view) view.scrollTop = 0;
    if (HHC.screens && HHC.screens.onRouteChange) HHC.screens.onRouteChange(current);
  }

  function replace(name, params) { go(name, params, { replace: true }); }

  function back() {
    const prev = stack.pop();
    if (!prev) return false;
    current = prev;
    render();
    if (HHC.screens && HHC.screens.onRouteChange) HHC.screens.onRouteChange(current);
    return true;
  }

  function render() {
    const route = routes[current.name];
    const view = document.getElementById('view');
    view.innerHTML = '';
    const node = route.render(current.params, current);
    if (node instanceof Node) view.appendChild(node);
    else view.innerHTML = node;
    if (route.mount) route.mount(view, current.params);
    /* 라우트 진입 애니메이션 재생 */
    const screen = view.firstElementChild;
    if (screen) { screen.style.animation = 'none'; void screen.offsetWidth; screen.style.animation = ''; }
  }

  function canGoBack() { return stack.length > 0; }
  function getCurrent() { return current; }
  function reset(name, params) { stack.length = 0; go(name, params, { replace: true }); }

  return { register, go, replace, back, canGoBack, getCurrent, reset, render };
})();

/* ==========================================================================
   TABBAR
   ========================================================================== */
HHC.tabbar = (function () {
  const TABS = [
    { name: 'home', label: '홈', icon: 'fa-house' },
    { name: 'recommend', label: '추천', icon: 'fa-wand-magic-sparkles' },
    { name: 'hiking', label: '산행', icon: 'fa-person-hiking', cta: true },
    { name: 'records', label: '기록', icon: 'fa-chart-simple' },
    { name: 'profile', label: '마이', icon: 'fa-user' }
  ];
  let activeTab = null;

  function render() {
    const nav = document.getElementById('tabbar');
    nav.innerHTML = TABS.map((t) => `
      <button class="tabbar__item ${t.cta ? 'tabbar__item--cta' : ''}"
        data-tab="${t.name}" aria-label="${t.label}"
        ${activeTab === t.name ? 'aria-current="page"' : ''}>
        <i class="fa-solid ${t.icon}"></i>
        ${t.cta ? '' : `<span>${t.label}</span><span class="tabbar__dot"></span>`}
      </button>`).join('');
    nav.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => HHC.actions.goTab(btn.dataset.tab));
    });
  }

  function setActive(name) {
    activeTab = name;
    const nav = document.getElementById('tabbar');
    nav.querySelectorAll('[data-tab]').forEach((b) => {
      if (b.dataset.tab === name) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  function show(v) { document.getElementById('tabbar').classList.toggle('hide', !v); }
  return { render, setActive, show, TABS };
})();

/* ==========================================================================
   TOAST
   ========================================================================== */
HHC.toast = function (message, icon) {
  const layer = document.getElementById('toast-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="fa-solid ${icon || 'fa-circle-check'}"></i><span>${message}</span>`;
  layer.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 320);
  }, 2400);
};

/* ==========================================================================
   THEME — 토큰 기반 테마 즉시 적용
   ========================================================================== */
HHC.theme = (function () {
  function apply(prefs) {
    const html = document.documentElement;
    html.setAttribute('data-theme', prefs.theme || 'default');
    html.setAttribute('data-button-shape', prefs.buttonShape || 'pill');

    const root = html.style;
    /* 커스텀 색상 토큰 (설정에서 실시간 변경) */
    setToken(root, '--color-primary', prefs.customPrimary);
    setToken(root, '--color-primary-strong', prefs.customPrimary ? shade(prefs.customPrimary, -0.18) : null);
    setToken(root, '--color-secondary', prefs.customSecondary);
    if (prefs.customPrimary) {
      root.setProperty('--grad-hero', `linear-gradient(155deg, ${shade(prefs.customPrimary, -0.34)} 0%, ${shade(prefs.customPrimary, -0.08)} 46%, ${shade(prefs.customPrimary, 0.14)} 100%)`);
      root.setProperty('--grad-ai', `linear-gradient(140deg, ${shade(prefs.customPrimary, -0.30)} 0%, ${shade(prefs.customPrimary, -0.06)} 55%, ${shade(prefs.customPrimary, 0.10)} 100%)`);
    } else {
      root.removeProperty('--grad-hero');
      root.removeProperty('--grad-ai');
    }
  }
  function setToken(style, name, value) {
    if (value) style.setProperty(name, value); else style.removeProperty(name);
  }
  /* hex 색상 밝기 조절 (amount: -1 ~ 1) */
  function shade(hex, amount) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return hex;
    const adj = (c) => {
      const v = parseInt(c, 16);
      const out = amount >= 0 ? v + (255 - v) * amount : v * (1 + amount);
      return Math.max(0, Math.min(255, Math.round(out))).toString(16).padStart(2, '0');
    };
    return `#${adj(m[1])}${adj(m[2])}${adj(m[3])}`;
  }
  return { apply, shade };
})();
