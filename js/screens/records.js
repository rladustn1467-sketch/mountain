/* ==========================================================================
   SCREENS — 나의 산행 기록 / 기록 상세 / 나의 산행 패턴(개인화 데이터)
   ========================================================================== */
(function () {
  const { ui, router, store } = HHC;
  const U = store.utils;

  /* ------------------------------------------------------------------
     나의 산행 기록
     ------------------------------------------------------------------ */
  router.register('records', {
    render() {
      const state = store.get();
      const stats = store.getStats();
      const recs = state.records;

      if (!recs.length) {
        return `<section class="screen">
          <header class="topbar"><span class="topbar__title">나의 산행 기록</span></header>
          <div class="screen__body screen__body--notitle">
            ${ui.empty('아직 산행 기록이 없습니다', '산행을 완료하면 거리 · 시간 · 고도 · AI 분석이 이곳에 축적됩니다.',
              `<button class="btn btn--primary" data-go="recommend"><i class="fa-solid fa-mountain"></i> 첫 산행 추천받기</button>`)}
            <div class="card card--inset">
              <div class="stat-grid stat-grid--3">
                ${ui.stat('산행 횟수', '0', '회')}${ui.stat('누적 거리', '—', '')}${ui.stat('누적 고도', '—', '')}
              </div>
              <p class="no-data" style="margin-top:var(--sp-3)"><i class="fa-solid fa-circle-info"></i>데이터가 쌓이면 통계가 자동으로 계산됩니다</p>
            </div>
          </div>
        </section>`;
      }

      /* 누적 요약 */
      const summary = `<div class="card card--ai">
        <div class="card__head" style="margin-bottom:var(--sp-4)">
          <div><span class="ai-badge"><i class="fa-solid fa-database"></i>누적 데이터</span>
            <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-md)">${stats.count}회 산행 · ${U.fmtDate(recs[recs.length - 1].date)} ~ ${U.fmtDate(recs[0].date)}</h2></div>
        </div>
        <div class="stat-grid stat-grid--3" style="gap:10px">
          ${ui.stat('누적 거리', stats.totalDistance.toFixed(1), 'km')}
          ${ui.stat('누적 고도', '+' + Math.round(stats.totalAscent), 'm')}
          ${ui.stat('누적 시간', Math.round(stats.totalDuration / 3600) + 'h', '')}
        </div>
        <div class="btn-row" style="margin-top:var(--sp-4)">
          <button class="btn btn--light" data-go="patterns">패턴 분석</button>
          <button class="btn btn--white" data-go="analysis">AI 분석</button>
        </div>
      </div>`;

      /* 회차별 거리 바 */
      const chart = `<section class="card card--flat">
        <div class="card__head" style="margin-bottom:var(--sp-4)">
          <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-chart-simple"></i> 회차별 거리</h2>
          <p class="card__sub">오래된 순 → 최근</p></div>
        </div>
        ${HHC.charts.bars(stats.series.map((r, i) => ({
          value: r.distance, label: U.fmtDate(r.date), short: `#${stats.count - stats.series.length + i + 1}`
        })))}
      </section>`;

      /* 기록 리스트 */
      const list = recs.map((r, i) => {
        const prev = recs[i + 1];
        const d = new Date(r.date);
        const dDelta = prev ? ((r.distance - prev.distance) / prev.distance) * 100 : 0;
        return `<article class="record-item">
          <button class="record-item__head" data-nav="toggle" aria-expanded="false">
            <div class="record-item__date">
              <div class="record-item__day num">${d.getDate()}</div>
              <div class="record-item__month">${d.getMonth() + 1}월</div>
            </div>
            <div class="record-item__info">
              <div class="record-item__name">${HHC.esc(r.name)}</div>
              <div class="record-item__meta">
                <span><i class="fa-solid fa-route"></i> ${r.distance.toFixed(1)}km</span>
                <span><i class="fa-solid fa-clock"></i> ${U.fmtDur(r.duration)}</span>
                <span><i class="fa-solid fa-mountain"></i> +${r.ascent}m</span>
              </div>
            </div>
            <div class="record-item__tail" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              ${ui.levelChip(r.level)}
              ${prev ? ui.delta(dDelta, '%', true) : ''}
            </div>
          </button>
          <div class="record-item__body hide" data-body>
            <div class="stat-grid stat-grid--3">
              ${ui.stat('평균 페이스', r.avgPace ? U.fmtPace(r.avgPace) : '—', '')}
              ${ui.stat('최고 고도', r.maxAlt || '—', r.maxAlt ? 'm' : '')}
              ${ui.stat('칼로리', r.calories || '—', r.calories ? 'kcal' : '')}
            </div>
            ${HHC.charts.elevation(r.elevation || [0, 50, 120, 200, 260, 300, 340, 300, 240, 180, 120, 60, 20])}
            <div class="btn-row">
              <button class="btn btn--outline btn--sm" data-go="record-detail" data-record="${r.id}">상세 · AI 분석</button>
              <button class="btn btn--ghost btn--sm" data-nav="delete" data-record="${r.id}"><i class="fa-solid fa-trash"></i> 삭제</button>
            </div>
          </div>
        </article>`;
      }).join('');

      return `<section class="screen">
        <header class="topbar topbar--line">
          <span class="topbar__title">나의 산행 기록</span>
          <span class="chip chip--sm">${stats.count}회</span>
        </header>
        <div class="screen__body screen__body--notitle">
          ${summary}${chart}
          <section class="section">
            <div class="section__head"><h2 class="section__title">전체 기록</h2>
              <span class="section__hint">탭하여 펼치기</span></div>
            <div class="stack-3" data-list>${list}</div>
          </section>
        </div>
      </section>`;
    },
    mount(el) {
      el.addEventListener('click', (e) => {
        const del = e.target.closest('[data-nav="delete"]');
        if (del) {
          e.stopPropagation();
          const id = del.dataset.record;
          if (confirm('이 산행 기록을 삭제할까요? 통계와 다음 추천이 즉시 다시 계산됩니다.')) {
            store.deleteRecord(id);
            HHC.toast('기록을 삭제했습니다. 통계가 다시 계산되었습니다', 'fa-trash');
            router.replace('records');
          }
          return;
        }
        const toggle = e.target.closest('[data-nav="toggle"]');
        if (toggle) {
          const body = toggle.parentElement.querySelector('[data-body]');
          const open = !body.classList.contains('hide');
          body.classList.toggle('hide', open);
          toggle.setAttribute('aria-expanded', String(!open));
        }
      });
    }
  });

  /* ------------------------------------------------------------------
     기록 상세 + 개별 AI 분석
     ------------------------------------------------------------------ */
  router.register('record-detail', {
    render(params) {
      const recs = store.get().records;
      const r = recs.find((x) => x.id === params.record) || recs[0];
      if (!r) return `<section class="screen"><div class="screen__body">${ui.empty('기록이 없습니다', '산행을 완료해 주세요.')}</div></section>`;
      const idx = recs.findIndex((x) => x.id === r.id);
      const prev = recs[idx + 1] || null;
      const dDelta = prev ? ((r.distance - prev.distance) / prev.distance) * 100 : 0;
      const aDelta = prev ? ((r.ascent - prev.ascent) / prev.ascent) * 100 : 0;
      const pDelta = prev && prev.avgPace ? ((r.avgPace - prev.avgPace) / prev.avgPace) * 100 : 0;

      return `<section class="screen">
        <header class="topbar topbar--line">
          <button class="icon-btn" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="topbar__title">산행 상세</span>
        </header>
        <div class="screen__body screen__body--notitle">
          <div class="result-hero">
            <div class="hero__eyebrow">${U.fmtDate(r.date)} · ${U.fmtRelative(r.date)}</div>
            <h1 class="hero__title" style="font-size:var(--fs-lg)">${HHC.esc(r.name)}</h1>
            <div class="result-stats">
              <div class="result-stat"><b class="num">${r.distance.toFixed(1)}</b><span>km</span></div>
              <div class="result-stat"><b>${U.fmtDur(r.duration)}</b><span>시간</span></div>
              <div class="result-stat"><b class="num">+${r.ascent}</b><span>고도(m)</span></div>
            </div>
          </div>

          <div class="card">
            <div class="stat-grid stat-grid--3">
              ${ui.stat('평균 페이스', r.avgPace ? U.fmtPace(r.avgPace) : '—', '')}
              ${ui.stat('최고 고도', r.maxAlt || '—', r.maxAlt ? 'm' : '')}
              ${ui.stat('칼로리', r.calories || '—', r.calories ? 'kcal' : '')}
            </div>
          </div>

          ${prev ? `<div class="card card--alt">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-arrow-right-arrow-left"></i> 이전 산행 대비</h2>
            </div>
            <div class="stack-3">
              <div class="between"><span style="font-size:var(--fs-sm)">거리</span>${ui.delta(dDelta, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">고도 상승</span>${ui.delta(aDelta, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">평균 페이스</span>${ui.delta(-pDelta, '%', true)}</div>
            </div>
          </div>` : ui.notice('기준선이 된 첫 기록입니다.', 'muted', 'fa-ruler')}

          <div class="card card--flat">
            <div class="card__head" style="margin-bottom:var(--sp-2)">
              <h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-chart-area"></i> 고도 프로필</h2>
            </div>
            ${HHC.charts.elevation(r.elevation || [0, 50, 120, 200, 260, 300, 340, 300, 240, 180, 120, 60, 20])}
          </div>

          ${r.splits && r.splits.length ? `<div class="card card--flat">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-gauge-high"></i> 구간 페이스</h2>
            </div>
            <div class="pace-splits">
              ${r.splits.map((s) => `<div class="split-row">
                <span class="split-row__label">${s.km.toFixed(1)}km</span>
                <span class="split-row__bar"><span style="width:${Math.min(100, (s.pace || 2) / 2 * 100)}%"></span></span>
                <span class="split-row__val num">${U.fmtPace(s.pace)}</span></div>`).join('')}
            </div>
          </div>` : ''}

          <div class="card card--ai">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>이 산행의 AI 코멘트</span></div>
            </div>
            ${ui.aiPoints(buildSingleComment(r, prev))}
          </div>

          <div class="btn-row">
            <button class="btn btn--outline" data-go="records">목록으로</button>
            <button class="btn btn--primary" data-go="recommend">다음 산행 추천</button>
          </div>
        </div>
      </section>`;
    }
  });

  function buildSingleComment(r, prev) {
    const out = [];
    if (!prev) {
      out.push({ icon: 'fa-flag', text: `기준선 기록 · ${r.distance.toFixed(1)}km · ${U.fmtDur(r.duration)} · +${r.ascent}m` });
      out.push({ icon: 'fa-brain', text: '이 기록을 기준으로 다음 산행 난이도를 계산합니다.' });
      return out;
    }
    const d = ((r.distance - prev.distance) / prev.distance) * 100;
    out.push({ icon: d >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down',
      text: `이전 산행보다 거리는 약 ${Math.abs(d).toFixed(0)}% ${d >= 0 ? '증가' : '감소'}했습니다.` });
    const a = ((r.ascent - prev.ascent) / prev.ascent) * 100;
    out.push({ icon: 'fa-mountain', text: `고도 상승은 ${Math.abs(a).toFixed(0)}% ${a >= 0 ? '늘었습니다' : '줄었습니다'}.` });
    out.push({ icon: 'fa-wave-square', text: `페이스 안정성 ${r.paceStability || '—'}/100 · 오르막 구간 리듬이 ${(r.paceStability || 0) >= 75 ? '안정적이었습니다' : '다소 불규칙했습니다'}.` });
    const gap = Math.round((r.date - prev.date) / 86400000);
    out.push({ icon: 'fa-calendar-days', text: `이전 산행 이후 ${gap}일 만의 산행입니다.` });
    return out;
  }

  /* ------------------------------------------------------------------
     나의 산행 패턴 / 개인화 데이터
     ------------------------------------------------------------------ */
  router.register('patterns', {
    render() {
      const stats = store.getStats();
      const analysis = store.buildAnalysis();
      const profile = store.get().profile || {};

      if (!stats.hasData) {
        return `<section class="screen">
          <header class="topbar topbar--line">
            <button class="icon-btn" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
            <span class="topbar__title">나의 산행 패턴</span>
          </header>
          <div class="screen__body screen__body--notitle">
            ${ui.empty('아직 학습할 데이터가 없습니다', '산행을 완료할 때마다 AI가 평균 거리 · 고도 · 산행 주기 · 선호 난이도를 학습합니다.',
              `<button class="btn btn--primary" data-go="recommend"><i class="fa-solid fa-mountain"></i> 첫 산행 추천받기</button>`)}
            <div class="card card--inset">
              <div class="inline" style="gap:8px;margin-bottom:10px"><i class="fa-solid fa-circle-info" style="color:var(--color-primary)"></i>
                <strong style="font-size:var(--fs-sm)">데이터 없음 상태</strong></div>
              <p class="text-muted" style="font-size:var(--fs-sm)">평균 거리, 평균 칼로리, 최근 산행, 산행 주기 같은 값은 <strong>실제 기록이 있을 때만</strong> 표시됩니다. 없는 값을 임의로 채우지 않습니다.</p>
            </div>
          </div>
        </section>`;
      }

      const curLevel = (HHC.LEVELS[stats.preferredLevel] || {}).label;
      const rec = store.recommendNext();

      return `<section class="screen">
        <header class="topbar topbar--line">
          <button class="icon-btn" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="topbar__title">나의 산행 패턴</span>
          <span class="chip chip--sm chip--active">${stats.stage === 'personalized' ? '개인화 활성' : '축적 중'}</span>
        </header>
        <div class="screen__body screen__body--notitle">

          <div class="card">
            <div class="card__head">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-fingerprint"></i> 학습된 산행 패턴</h2>
                <p class="card__sub">${stats.count}회 기록에서 추출</p></div>
              <div style="text-align:center">
                ${HHC.charts.ring(analysis.confidence, '신뢰도')}
              </div>
            </div>
            <div class="pattern-grid">
              <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-calendar-days"></i>평균 산행 주기</div>
                <div class="pattern-tile__value num">${stats.avgGap != null ? stats.avgGap.toFixed(0) : '—'}<small style="font-size:.5em">일</small></div></div>
              <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-route"></i>평균 거리</div>
                <div class="pattern-tile__value num">${stats.avgDistance.toFixed(1)}<small style="font-size:.5em">km</small></div></div>
              <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-mountain"></i>평균 고도 상승</div>
                <div class="pattern-tile__value num">+${Math.round(stats.avgAscent)}<small style="font-size:.5em">m</small></div></div>
              <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-clock"></i>평균 산행 시간</div>
                <div class="pattern-tile__value">${U.fmtDur(stats.avgDuration)}</div></div>
              <div class="pattern-tile pattern-tile--accent"><div class="pattern-tile__label"><i class="fa-solid fa-signal"></i>선호 난이도</div>
                <div class="pattern-tile__value">${curLevel}</div></div>
              <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-gauge-high"></i>평균 페이스</div>
                <div class="pattern-tile__value" style="font-size:var(--fs-lg)">${stats.avgPace ? U.fmtPace(stats.avgPace) : '—'}</div></div>
            </div>
            <div style="margin-top:var(--sp-4)">
              <div class="section__hint" style="margin-bottom:6px">회차별 거리 추세</div>
              ${HHC.charts.sparkline(stats.series.map((r) => r.distance), { height: 60 })}
            </div>
          </div>

          <section class="card card--alt">
            <div class="card__head" style="margin-bottom:var(--sp-4)">
              <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-chart-line"></i> 최근 변화</h2>
                <p class="card__sub">${stats.count}회 기록 · 최근 절반 vs 이전 절반</p></div>
            </div>
            <div class="stack-3">
              <div class="between"><span style="font-size:var(--fs-sm)">평균 거리</span>${ui.delta(stats.distanceTrend, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">평균 고도 상승</span>${ui.delta(stats.ascentTrend, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">오르막 페이스 안정성</span>${ui.delta(stats.stabilityTrend, '%', true)}</div>
              <div class="between"><span style="font-size:var(--fs-sm)">산행 주기</span>
                <span class="stat__delta delta-flat"><i class="fa-solid fa-clock"></i>평균 ${stats.avgGap != null ? stats.avgGap.toFixed(0) + '일' : '—'}</span></div>
            </div>
          </section>

          <section class="card card--ai">
            <div class="card__head" style="margin-bottom:var(--sp-3)">
              <div><span class="ai-badge"><i class="fa-solid fa-brain"></i>패턴 기반 AI 요약</span></div>
            </div>
            ${ui.aiPoints(analysis.points.slice(0, 3))}
          </section>

          <div class="card card--inset">
            <div class="between" style="margin-bottom:var(--sp-3)">
              <strong style="font-size:var(--fs-sm)">다음 추천에 반영된 값</strong>
              <button class="card__link" data-go="recommend">추천 보기 <i class="fa-solid fa-chevron-right"></i></button>
            </div>
            <div class="stack-2">
              <div class="between"><span class="text-muted" style="font-size:var(--fs-sm)">목표 난이도</span><strong>${(HHC.LEVELS[rec.targetLevel] || {}).label}</strong></div>
              <div class="between"><span class="text-muted" style="font-size:var(--fs-sm)">목표 거리</span><strong class="num">${rec.targetDistance.toFixed(1)} km</strong></div>
              <div class="between"><span class="text-muted" style="font-size:var(--fs-sm)">1순위 코스</span><strong style="font-size:var(--fs-sm)">${HHC.esc(rec.courses[0].name)}</strong></div>
              <div class="between"><span class="text-muted" style="font-size:var(--fs-sm)">사용자 목표</span><strong style="font-size:var(--fs-sm)">${(HHC.ONBOARDING.goal.find((o) => o.value === profile.goal) || {}).title || '미설정'}</strong></div>
            </div>
          </div>

          <div class="btn-row">
            <button class="btn btn--outline" data-go="records">기록 보기</button>
            <button class="btn btn--primary" data-go="recommend"><i class="fa-solid fa-wand-magic-sparkles"></i> 다음 추천</button>
          </div>
        </div>
      </section>`;
    }
  });
})();
