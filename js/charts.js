/* ==========================================================================
   CHARTS — 의존성 없는 경량 SVG 차트
   색상은 모두 CSS 변수(currentColor / var(--color-primary))를 사용하므로
   테마를 바꾸면 그래프 색도 함께 바뀝니다.
   ========================================================================== */
window.HHC = window.HHC || {};

HHC.charts = (function () {

  /* ---------------------- 고도 프로필 (area chart) ---------------------- */
  function elevation(values, opts) {
    opts = opts || {};
    const w = opts.width || 340, hgt = opts.height || 120, pad = 8;
    const flat = opts.flatten !== false;
    const max = Math.max.apply(null, values);
    const min = Math.min.apply(null, values);
    const range = Math.max(1, max - min);
    const stepX = (w - pad * 2) / (values.length - 1);

    const pts = values.map((v, i) => {
      const x = pad + i * stepX;
      const y = flat
        ? pad + (1 - (v - min) / range) * (hgt - pad * 2)
        : hgt - pad - (v / max) * (hgt - pad * 2);
      return [x, y];
    });

    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${hgt} L ${pts[0][0].toFixed(1)} ${hgt} Z`;
    const peak = pts[values.indexOf(max)];

    return `<svg class="chart-box--elev" viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="none"
      style="width:100%;height:${hgt}px;display:block" role="img"
      aria-label="고도 프로필, 최고 ${max}m">
      <defs>
        <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity=".30"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity=".02"/>
        </linearGradient>
      </defs>
      <g stroke="var(--color-border)" stroke-width="1" stroke-dasharray="3 5">
        <line x1="0" y1="${hgt * .33}" x2="${w}" y2="${hgt * .33}"/>
        <line x1="0" y1="${hgt * .66}" x2="${w}" y2="${hgt * .66}"/>
      </g>
      <path d="${area}" fill="url(#elevFill)"/>
      <path d="${line}" fill="none" stroke="var(--color-primary)" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${peak[0].toFixed(1)}" cy="${peak[1].toFixed(1)}" r="4"
        fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="2.4"/>
    </svg>`;
  }

  /* ---------------------- 스파크라인 (추세) ---------------------- */
  function sparkline(values, opts) {
    opts = opts || {};
    const w = 300, hgt = opts.height || 54, pad = 6;
    if (!values.length) return '';
    const max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    const range = Math.max(1, max - min);
    const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
    const pts = values.map((v, i) => [pad + i * stepX, hgt - pad - ((v - min) / range) * (hgt - pad * 2)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${hgt} L ${pts[0][0].toFixed(1)} ${hgt} Z`;
    return `<svg class="sparkline" viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="none" role="img" aria-label="추세 그래프">
      <path class="area" d="${area}"/>
      <path class="line" d="${line}"/>
    </svg>`;
  }

  /* ---------------------- 링 게이지 (0~100) ---------------------- */
  function ring(value, label, sub) {
    const size = 132, stroke = 11, r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, value));
    const dash = (pct / 100) * c;
    return `<div class="ring-wrap">
      <svg viewBox="0 0 ${size} ${size}" class="ring" role="img" aria-label="${label} ${Math.round(pct)}점">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="var(--color-surface-3)" stroke-width="${stroke}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="var(--color-primary)" stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}"
          transform="rotate(-90 ${size / 2} ${size / 2})"/>
      </svg>
      <div class="ring__center">
        <b class="num">${Math.round(pct)}</b>
        <span>${label}</span>
      </div>
    </div>`;
  }

  /* ---------------------- 수직 바 (회차별 거리) ---------------------- */
  function bars(items, opts) {
    opts = opts || {};
    const max = Math.max.apply(null, items.map((i) => i.value).concat([1]));
    return `<div class="minibars" role="img" aria-label="${opts.label || '회차별 기록'}">
      ${items.map((it) => `<div class="minibar" title="${HHC.esc(it.label)}: ${it.value}">
        <div class="minibar__track"><span style="height:${(it.value / max * 100).toFixed(1)}%"></span></div>
        <div class="minibar__label">${HHC.esc(it.short)}</div>
      </div>`).join('')}
    </div>`;
  }

  /* ---------------------- 지도 + 트레일 경로 (프로토타입) ---------------------- */
  function trailMap(progress, opts) {
    opts = opts || {};
    const p = typeof progress === 'number' ? progress : 0;
    const d = 'M40 150 C 80 120, 92 78, 140 66 S 214 92, 244 58 S 300 30, 316 54';
    return `<svg viewBox="0 0 360 190" preserveAspectRatio="xMidYMid slice" aria-label="등산로 경로 프로토타입">
      <defs>
        <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--color-primary-100)" stop-opacity=".9"/>
          <stop offset="100%" stop-color="var(--color-secondary-100)" stop-opacity=".65"/>
        </linearGradient>
      </defs>
      <rect width="360" height="190" fill="url(#terrain)"/>
      <g fill="none" stroke="var(--color-primary-300)" stroke-opacity=".45" stroke-width="1">
        <path d="M-10 40 C 60 10, 120 80, 190 44 S 300 12, 380 48"/>
        <path d="M-10 78 C 60 48, 126 118, 196 82 S 306 50, 386 86"/>
        <path d="M-10 116 C 60 86, 122 156, 192 120 S 302 88, 382 124"/>
        <path d="M-10 154 C 60 124, 126 194, 196 158 S 306 126, 386 162"/>
      </g>
      <!-- 경로 -->
      <path d="${d}" fill="none" stroke="var(--color-surface)" stroke-width="7" stroke-linecap="round" opacity=".85"/>
      <path d="${d}" fill="none" stroke="var(--color-primary-400)" stroke-width="3.4"
        stroke-linecap="round" stroke-dasharray="${(p / 100 * 340).toFixed(0)} 340"/>
      <!-- 시작 / 정상 -->
      <circle cx="40" cy="150" r="7" fill="var(--color-surface)" stroke="var(--color-secondary-500)" stroke-width="3.4"/>
      <circle cx="316" cy="54" r="7" fill="var(--color-surface)" stroke="var(--color-primary-600)" stroke-width="3.4"/>
      <!-- 현재 위치 -->
      <g class="map-marker" data-marker="1">
        <circle cx="40" cy="150" r="11" fill="var(--color-primary)" opacity=".22"/>
        <circle cx="40" cy="150" r="5.6" fill="var(--color-primary)" stroke="#fff" stroke-width="2.4"/>
      </g>
    </svg>`;
  }

  return { elevation, sparkline, ring, bars, trailMap };
})();
