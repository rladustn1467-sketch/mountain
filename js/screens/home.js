/* ==========================================================================
   SCREEN — 홈 / 대시보드
   --------------------------------------------------------------------------
   데이터 상태에 따라 홈 자체가 진화합니다.
     stage 'new'          → 데이터 없음 + 첫 산행 CTA
     stage 'growing'      → 최근 산행 + 기본 AI 분석 + 다음 산행 추천
     stage 'personalized' → 산행 패턴 + 난이도 변화 + 장기 개선점
   ========================================================================== */
(function () {
  const { ui, router, store } = HHC;
  const U = store.utils;

  function greeting() {
    const h = new Date().getHours();
    if (h < 6) return '이른 시간이네요';
    if (h < 12) return '좋은 아침이에요';
    if (h < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  }

  /* --------------------------- 신규 사용자 홈 --------------------------- */
  function newcomerHome(profile) {
    const exp = (HHC.ONBOARDING.experience.find((o) => o.value === profile.experience) || {}).title;
    const pref = (HHC.ONBOARDING.preference.find((o) => o.value === profile.preference) || {}).title;
    const goal = (HHC.ONBOARDING.goal.find((o) => o.value === profile.goal) || {}).title;
    return `
      <div class="newcomer-hero">
        <img class="newcomer-hero__img" src="${HHC.IMAGES.ridge}" alt="아침 안개가 낀 산 능선">
        <div class="hero__eyebrow">처음 오셨나요?</div>
        <h2 class="newcomer-hero__title">나에게 맞는<br>첫 산행을 찾아보세요</h2>
        <p class="newcomer-hero__desc">아직 산행 기록이 없습니다. 입력하신 경험 수준과 선호도, 목표를 바탕으로 첫 산행 코스를 추천해드립니다.</p>
        <div class="newcomer-prompt">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>${exp || '입력 정보'} · ${pref || '선호도'} · ${goal || '목표'} 기반 추천</span>
        </div>
      </div>

      <button class="btn btn--primary btn--lg btn--block" data-go="first-recommend">
        <i class="fa-solid fa-mountain"></i> 첫 산행 추천받기
      </button>

      <div class="card card--inset">
        <div class="card__head" style="margin-bottom:var(--sp-2)">
          <h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-arrows-spin"></i> 어떻게 개인화되나요?</h2>
        </div>
        <ul class="algo-steps">
          <li class="algo-step"><span class="algo-step__dot">1</span><div><div class="algo-step__label">첫 산행 완료</div><div class="algo-step__value">기준선(baseline) 데이터 생성</div></div></li>
          <li class="algo-step"><span class="algo-step__dot">2</span><div><div class="algo-step__label">AI 분석</div><div class="algo-step__value">거리 · 고도 · 페이스 비교</div></div></li>
          <li class="algo-step"><span class="algo-step__dot">3</span><div><div class="algo-step__label">패턴 학습</div><div class="algo-step__value">산행 주기와 선호 난이도 학습</div></div></li>
          <li class="algo-step"><span class="algo-step__dot">4</span><div><div class="algo-step__label">다음 추천 개인화</div><div class="algo-step__value">기록이 쌓일수록 정교해짐</div></div></li>
        </ul>
      </div>

      <section class="section">
        <div class="section__head"><h2 class="section__title">데이터 현황</h2>
          <span class="section__hint">아직 비어 있음</span></div>
        <div class="card card--flat" style="border-style:dashed">
          <div class="stat-grid stat-grid--3">
            ${ui.stat('산행 횟수', '0', '회')}
            ${ui.stat('평균 거리', '—', '')}
            ${ui.stat('평균 고도', '—', '')}
          </div>
          <p class="no-data" style="margin-top:var(--sp-3)"><i class="fa-solid fa-circle-info"></i>아직 데이터가 없습니다. 첫 산행을 시작해 주세요.</p>
        </div>
      </section>

      <div class="card card--weather">
        <div class="card__head" style="margin-bottom:var(--sp-3)">
          <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-cloud-sun"></i> 산행 예정일 날씨</h2>
            <p class="card__sub">${HHC.WEATHER.date} 기준</p></div>
        </div>
        ${ui.weatherStrip(HHC.WEATHER)}
        <p class="text-muted" style="font-size:var(--fs-xs);margin-top:var(--sp-3)">${HHC.WEATHER.summary}</p>
      </div>`;
  }

  /* --------------------------- 성장 / 개인화 홈 --------------------------- */
  function activeHome(stats, analysis, rec) {
    const last = stats.last;
    const isGrowing = stats.stage === 'growing';
    const nextCourse = rec.courses[0];

    /* 상태 전환 배너 — 실제 조건에 따라 문구가 바뀝니다 */
    let banner = '';
    if (isGrowing) {
      banner = `<div class="stage-banner stage-banner--grow">
        <i class="fa-solid fa-seedling"></i>
        <div><strong>${stats.count === 1 ? '첫 산행을 완료했어요!' : '데이터가 축적되는 중입니다.'}</strong><br>
        ${stats.count === 1
          ? 'AI가 첫 산행 데이터를 분석했습니다. 기준선이 만들어졌어요.'
          : `${stats.count}회의 산행 기록으로 기본 패턴을 학습하고 있습니다. 3회 이상이면 개인화가 활성화됩니다.`}</div>
      </div>`;
    } else {
      banner = `<div class="stage-banner stage-banner--done">
        <i class="fa-solid fa-shield-heart"></i>
        <div><strong>개인화가 활성화되었습니다.</strong><br>
        ${stats.count}회의 산행 기록으로 난이도 변화와 장기 추세를 분석하고 있습니다.</div>
      </div>`;
    }

    /* 최근 산행 변화 요약 */
    const deltaLine = stats.previous
      ? `<div class="inline wrap" style="gap:10px">
           ${ui.delta(stats.distanceTrend, '%', true)}<span class="text-faint" style="font-size:var(--fs-xs)">거리</span>
           ${ui.delta(stats.ascentTrend, '%', true)}<span class="text-faint" style="font-size:var(--fs-xs)">고도</span>
         </div>`
      : `<span class="no-data"><i class="fa-solid fa-circle-info"></i>비교할 이전 산행 데이터가 없습니다</span>`;

    return `
      ${banner}

      <!-- 최근 산행 -->
      <section class="card recent-card">
        <div class="recent-card__head">
          <div>
            <h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-person-hiking"></i> 최근 산행</h2>
            <p class="card__sub">${U.fmtDate(last.date)} · ${U.fmtRelative(last.date)}</p>
          </div>
          ${ui.levelChip(last.level)}
        </div>

        <div class="stat-grid stat-grid--3">
          ${ui.stat('거리', last.distance.toFixed(1), 'km')}
          ${ui.stat('시간', U.fmtDur(last.duration), '')}
          ${ui.stat('상승 고도', '+' + Math.round(last.ascent), 'm')}
        </div>

        <div class="between">
          <span class="text-muted" style="font-size:var(--fs-xs)">최근 산행 변화</span>
          ${deltaLine}
        </div>

        ${stats.series.length > 1 ? `<div>
          <div class="inline between" style="margin-bottom:4px">
            <span class="text-faint" style="font-size:var(--fs-2xs)">최근 ${stats.series.length}회 거리 추세</span>
            <span class="text-faint" style="font-size:var(--fs-2xs)">단위 km</span>
          </div>
          ${HHC.charts.sparkline(stats.series.map((r) => r.distance))}
        </div>` : ''}

        <button class="btn btn--outline btn--block btn--sm" data-go="record-detail" data-record="${last.id}">산행 상세 보기</button>
      </section>

      <!-- AI 핵심 분석 -->
      <section class="card card--ai">
        <div class="card__head">
          <div>
            <span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>AI 산행 분석</span>
            <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-md)">${analysis.headline}</h2>
          </div>
          <div class="confidence" style="flex-direction:column;align-items:flex-end;gap:2px">
            <span class="num" style="font-size:var(--fs-xl);font-weight:var(--fw-black)">${analysis.confidence}%</span>
            <span class="confidence__label">분석 신뢰도</span>
          </div>
        </div>
        <div class="bar" style="margin-bottom:var(--sp-4)"><span style="width:${analysis.confidence}%"></span></div>
        ${ui.aiPoints(analysis.points.slice(0, 4))}
        <div class="btn-row" style="margin-top:var(--sp-4)">
          <button class="btn btn--light" data-go="analysis">전체 분석</button>
          <button class="btn btn--white" data-go="record-detail" data-record="${last.id}">이번 산행 결과</button>
        </div>
      </section>

      <!-- 다음 산행 추천 CTA (가장 중요한 CTA) -->
      <section class="card" style="border-color:var(--color-primary-200)">
        <div class="card__head">
          <div>
            <span class="ai-badge"><i class="fa-solid fa-bullseye"></i>다음 산행</span>
            <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-md)">다음 산행 추천받기</h2>
            <p class="card__sub">${stats.count}회 기록 + 산행 간격 ${stats.avgGap != null ? stats.avgGap.toFixed(0) + '일' : '—'} + 날씨 반영</p>
          </div>
        </div>
        <button class="btn btn--primary btn--lg btn--block" data-go="recommend">
          <i class="fa-solid fa-wand-magic-sparkles"></i> 다음 산행 추천받기
        </button>
        <p class="text-muted center" style="font-size:var(--fs-xs);margin-top:var(--sp-2)">
          ${nextCourse ? `지금 가장 적합한 코스 · <strong>${HHC.esc(nextCourse.name)}</strong>` : ''}
        </p>
      </section>

      <!-- 산행 패턴 (데이터 충분 시 강조) -->
      <section class="section">
        <div class="section__head"><h2 class="section__title">나의 산행 패턴</h2>
          <button class="card__link" data-go="patterns">전체 보기 <i class="fa-solid fa-chevron-right"></i></button></div>
        <div class="pattern-grid">
          <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-calendar-days"></i>평균 산행 주기</div>
            <div class="pattern-tile__value num">${stats.avgGap != null ? stats.avgGap.toFixed(0) : '—'}<small style="font-size:.5em">일</small></div></div>
          <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-route"></i>평균 거리</div>
            <div class="pattern-tile__value num">${stats.avgDistance.toFixed(1)}<small style="font-size:.5em">km</small></div></div>
          <div class="pattern-tile"><div class="pattern-tile__label"><i class="fa-solid fa-mountain"></i>평균 고도 상승</div>
            <div class="pattern-tile__value num">+${Math.round(stats.avgAscent)}<small style="font-size:.5em">m</small></div></div>
          <div class="pattern-tile pattern-tile--accent"><div class="pattern-tile__label"><i class="fa-solid fa-signal"></i>선호 난이도</div>
            <div class="pattern-tile__value">${(HHC.LEVELS[stats.preferredLevel] || {}).label}</div></div>
        </div>
      </section>

      <!-- 최근 변화 -->
      <section class="card card--alt">
        <div class="card__head" style="margin-bottom:var(--sp-3)">
          <h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-chart-line"></i> 최근 변화</h2>
          <span class="section__hint">최근 ${Math.ceil(stats.count / 2)}회 vs 이전</span>
        </div>
        <div class="stack-3">
          <div class="between"><span style="font-size:var(--fs-sm)">평균 거리</span>${ui.delta(stats.distanceTrend, '%', true)}</div>
          <div class="between"><span style="font-size:var(--fs-sm)">평균 고도 상승</span>${ui.delta(stats.ascentTrend, '%', true)}</div>
          <div class="between"><span style="font-size:var(--fs-sm)">오르막 페이스 안정성</span>${ui.delta(stats.stabilityTrend, '%', true)}</div>
        </div>
      </section>

      <!-- 날씨 -->
      <div class="card card--weather">
        <div class="card__head" style="margin-bottom:var(--sp-3)">
          <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-cloud-sun"></i> 다음 산행 예정일 날씨</h2>
            <p class="card__sub">${HHC.WEATHER.date} · ${HHC.WEATHER.condition}</p></div>
        </div>
        ${ui.weatherStrip(HHC.WEATHER)}
        <p class="text-muted" style="font-size:var(--fs-xs);margin-top:var(--sp-3)">${HHC.WEATHER.summary}</p>
      </div>`;
  }

  /* ------------------------------- 등록 ------------------------------- */
  router.register('home', {
    render() {
      const state = store.get();
      const stats = store.getStats();
      const analysis = store.buildAnalysis();
      const rec = store.recommendNext();
      const profile = state.profile || { name: '산행러' };
      const initial = (profile.name || '산').trim().charAt(0);

      const body = stats.hasData ? activeHome(stats, analysis, rec) : newcomerHome(profile);

      return `<section class="screen">
        <header class="topbar">
          <div class="grow">
            <div class="home-greet__sub">${greeting()}</div>
            <h1 class="home-greet__title">${HHC.esc(profile.name || '산행러')}님</h1>
          </div>
          <button class="avatar" data-go="profile" aria-label="프로필 설정">${HHC.esc(initial)}</button>
        </header>
        <div class="screen__body screen__body--notitle">${body}</div>
      </section>`;
    }
  });
})();
