/* ==========================================================================
   CHARTS — 웹 렌더러 (SVG 문자열 생성)
   --------------------------------------------------------------------------
   좌표 계산은 @hhc/core 의 charts 모듈로 이동했다. 이 파일에 남은 책임은
   "core 가 계산한 좌표를 SVG 마크업으로 그리는 것" 하나다.

     core (플랫폼 중립)          이 파일 (웹 전용)
     ────────────────────        ──────────────────────────────
     좌표 · path · dasharray     <svg> · <path> · 그라디언트
     min/max/range · 진행률      CSS 변수 색상 · role · aria-label

   모바일은 같은 core 함수를 호출하고 react-native-svg 로 그리면 된다.
   계산식은 변경하지 않았다 — 출력 SVG 는 이전과 바이트 단위로 동일하다.

   색상은 모두 CSS 변수(var(--color-primary) 등)를 쓰므로 테마를 바꾸면
   그래프 색도 함께 바뀐다.
   ========================================================================== */
window.HHC = window.HHC || {};

HHC.charts = (function () {
  var core = window.HHCCore;
  if (!core) throw new Error('[HHC] @hhc/core 번들이 로드되지 않았습니다.');

  /* ---------------------- 고도 프로필 (area chart) ---------------------- */
  function elevation(values, opts) {
    var g = core.elevationGeometry(values, opts || {});

    return `<svg class="chart-box--elev" viewBox="0 0 ${g.width} ${g.height}" preserveAspectRatio="none"
      style="width:100%;height:${g.height}px;display:block" role="img"
      aria-label="고도 프로필, 최고 ${g.max}m">
      <defs>
        <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-primary)" stop-opacity=".30"/>
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity=".02"/>
        </linearGradient>
      </defs>
      <g stroke="var(--color-border)" stroke-width="1" stroke-dasharray="3 5">
        <line x1="0" y1="${g.gridY[0]}" x2="${g.width}" y2="${g.gridY[0]}"/>
        <line x1="0" y1="${g.gridY[1]}" x2="${g.width}" y2="${g.gridY[1]}"/>
      </g>
      <path d="${g.areaPath}" fill="url(#elevFill)"/>
      <path d="${g.linePath}" fill="none" stroke="var(--color-primary)" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${g.peak.x.toFixed(1)}" cy="${g.peak.y.toFixed(1)}" r="4"
        fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="2.4"/>
    </svg>`;
  }

  /* ---------------------- 스파크라인 (추세) ---------------------- */
  function sparkline(values, opts) {
    var g = core.sparklineGeometry(values, opts || {});
    if (!g) return '';

    return `<svg class="sparkline" viewBox="0 0 ${g.width} ${g.height}" preserveAspectRatio="none" role="img" aria-label="추세 그래프">
      <path class="area" d="${g.areaPath}"/>
      <path class="line" d="${g.linePath}"/>
    </svg>`;
  }

  /* ---------------------- 링 게이지 (0~100) ---------------------- */
  function ring(value, label) {
    var g = core.ringGeometry(value);

    return `<div class="ring-wrap">
      <svg viewBox="0 0 ${g.size} ${g.size}" class="ring" role="img" aria-label="${label} ${g.display}점">
        <circle cx="${g.center}" cy="${g.center}" r="${g.radius}" fill="none"
          stroke="var(--color-surface-3)" stroke-width="${g.stroke}"/>
        <circle cx="${g.center}" cy="${g.center}" r="${g.radius}" fill="none"
          stroke="var(--color-primary)" stroke-width="${g.stroke}" stroke-linecap="round"
          stroke-dasharray="${g.dash.toFixed(1)} ${g.circumference.toFixed(1)}"
          transform="rotate(-90 ${g.center} ${g.center})"/>
      </svg>
      <div class="ring__center">
        <b class="num">${g.display}</b>
        <span>${label}</span>
      </div>
    </div>`;
  }

  /* ---------------------- 수직 바 (회차별 거리) ---------------------- */
  function bars(items, opts) {
    opts = opts || {};
    var g = core.barsGeometry(items);

    return `<div class="minibars" role="img" aria-label="${opts.label || '회차별 기록'}">
      ${g.items.map((it) => `<div class="minibar" title="${HHC.esc(it.label)}: ${it.value}">
        <div class="minibar__track"><span style="height:${it.heightPct.toFixed(1)}%"></span></div>
        <div class="minibar__label">${HHC.esc(it.short)}</div>
      </div>`).join('')}
    </div>`;
  }

  /* ---------------------- 지도 + 트레일 경로 (프로토타입) ---------------------- */
  function trailMap(progress) {
    var g = core.trailGeometry(progress);

    return `<svg viewBox="0 0 ${g.viewWidth} ${g.viewHeight}" preserveAspectRatio="xMidYMid slice" aria-label="등산로 경로 프로토타입">
      <defs>
        <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--color-primary-100)" stop-opacity=".9"/>
          <stop offset="100%" stop-color="var(--color-secondary-100)" stop-opacity=".65"/>
        </linearGradient>
      </defs>
      <rect width="${g.viewWidth}" height="${g.viewHeight}" fill="url(#terrain)"/>
      <g fill="none" stroke="var(--color-primary-300)" stroke-opacity=".45" stroke-width="1">
        ${g.contours.map((d) => `<path d="${d}"/>`).join('\n        ')}
      </g>
      <!-- 경로 -->
      <path d="${g.path}" fill="none" stroke="var(--color-surface)" stroke-width="7" stroke-linecap="round" opacity=".85"/>
      <path d="${g.path}" fill="none" stroke="var(--color-primary-400)" stroke-width="3.4"
        stroke-linecap="round" stroke-dasharray="${g.dash.toFixed(0)} ${g.totalLength}"/>
      <!-- 시작 / 정상 -->
      <circle cx="${g.start.x}" cy="${g.start.y}" r="7" fill="var(--color-surface)" stroke="var(--color-secondary-500)" stroke-width="3.4"/>
      <circle cx="${g.summit.x}" cy="${g.summit.y}" r="7" fill="var(--color-surface)" stroke="var(--color-primary-600)" stroke-width="3.4"/>
      <!-- 현재 위치 -->
      <g class="map-marker" data-marker="1">
        <circle cx="${g.marker.x}" cy="${g.marker.y}" r="11" fill="var(--color-primary)" opacity=".22"/>
        <circle cx="${g.marker.x}" cy="${g.marker.y}" r="5.6" fill="var(--color-primary)" stroke="#fff" stroke-width="2.4"/>
      </g>
    </svg>`;
  }

  return { elevation, sparkline, ring, bars, trailMap };
})();
