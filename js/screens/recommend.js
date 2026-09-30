/* ==========================================================================
   SCREENS — 다음 산행 추천 (알고리즘 UI) / 추천 코스 상세 / 이번 산행 목표
   ========================================================================== */
(function () {
  const { ui, router, store } = HHC;
  const U = store.utils;

  /* ------------------------------------------------------------------
     추천 알고리즘 입력 카드
     ------------------------------------------------------------------ */
  function algoInputs(stats, profile) {
    const items = [
      { icon: 'fa-clock-rotate-left', label: '이전 산행 기록', value: stats.hasData ? `${stats.count}회 저장됨` : '기록 없음' },
      { icon: 'fa-calendar-days', label: '최근 산행 간격', value: stats.avgGap != null ? `약 ${stats.avgGap.toFixed(0)}일 (최근 ${Math.round(stats.daysSinceLast)}일 전)` : (profile.plan ? '예정 시점 반영' : '데이터 없음') },
      { icon: 'fa-route', label: '평균 산행 거리', value: stats.hasData ? `${stats.avgDistance.toFixed(1)} km` : '미입력' },
      { icon: 'fa-mountain', label: '평균 고도 상승', value: stats.hasData ? `+${Math.round(stats.avgAscent)} m` : '미입력' },
      { icon: 'fa-signal', label: '산행 난이도', value: stats.hasData ? (HHC.LEVELS[stats.preferredLevel] || {}).label : '입력 정보 기준' },
      { icon: 'fa-bullseye', label: '사용자 목표', value: (HHC.ONBOARDING.goal.find((o) => o.value === profile.goal) || {}).title || '가볍게 등산' },
      { icon: 'fa-chart-line', label: '최근 산행 성과', value: stats.hasData ? trendLabel(stats.trendDirection) : '기준선 없음' },
      { icon: 'fa-cloud-sun', label: '예정일 날씨', value: `${HHC.WEATHER.condition} ${HHC.WEATHER.tempMin}~${HHC.WEATHER.tempMax}°C · 강수 ${HHC.WEATHER.rain}%` }
    ];
    return `<div class="card card--ai">
      <div class="card__head">
        <div>
          <span class="ai-badge"><i class="fa-solid fa-microchip"></i>추천 알고리즘</span>
          <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-md)">AI가 다음 데이터를 종합했습니다</h2>
        </div>
        <div style="text-align:right">
          <span class="num" style="font-size:var(--fs-xl);font-weight:var(--fw-black)">${stats.hasData ? Math.min(96, 45 + stats.count * 8) : 62}%</span>
          <div class="confidence__label">신뢰도</div>
        </div>
      </div>
      <div class="algo-steps">
        ${items.map((it) => `<div class="algo-step">
          <span class="algo-step__dot"><i class="fa-solid ${it.icon}"></i></span>
          <div><div class="algo-step__label">${it.label}</div><div class="algo-step__value">${HHC.esc(it.value)}</div></div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function trendLabel(dir) {
    return dir === 'up' ? '꾸준히 향상 ↑' : dir === 'down' ? '최근 소폭 하락 ↓' : '유지 중 →';
  }

  /* ------------------------------------------------------------------
     다음 산행 추천
     ------------------------------------------------------------------ */
  router.register('recommend', {
    render() {
      const state = store.get();
      const profile = state.profile || {};
      const stats = store.getStats();
      const rec = store.recommendNext();

      /* 추천 이유 카드 */
      const reasonCard = `<div class="card">
        <div class="card__head">
          <div>
            <span class="ai-badge"><i class="fa-solid fa-comment-dots"></i>AI 추천 이유</span>
            <h2 class="card__title" style="margin-top:10px;font-size:var(--fs-md)">왜 이 코스를 추천했나요?</h2>
          </div>
        </div>
        <ul class="ai-points ai-points--light">
          ${rec.reasons.map((r) => `<li><i class="fa-solid fa-check"></i><span>${r}</span></li>`).join('')}
        </ul>
        ${stats.hasData && stats.count >= 2 ? `
          <div style="margin-top:var(--sp-4);padding-top:var(--sp-4);border-top:1px dashed var(--color-border)">
            <div class="section__hint" style="margin-bottom:6px">최근 산행 거리 추세</div>
            ${HHC.charts.sparkline(stats.series.map((r) => r.distance))}
          </div>` : ''}
      </div>`;

      /* 신규 사용자 안내 */
      const scienceNote = !stats.hasData
        ? ui.notice('아직 산행 기록이 없어 <strong>입력 정보 + 코스 정보 + 날씨</strong> 기반으로 추천했습니다. 첫 산행을 마치면 추천 정확도가 크게 올라갑니다.', '', 'fa-seedling')
        : (stats.stage === 'growing'
          ? ui.notice(`현재 <strong>${stats.count}회</strong> 기록으로 추천 중입니다. 3회 이상 쌓이면 난이도 변화 추세까지 반영됩니다.`, 'muted', 'fa-database')
          : ui.notice(`<strong>${stats.count}회</strong>의 산행 기록과 실제 산행 주기를 학습해 추천했습니다.`, '', 'fa-circle-check'));

      return `<section class="screen">
        <header class="topbar topbar--line">
          <span class="topbar__title">다음 산행 추천</span>
          <button class="icon-btn" data-go="home" aria-label="홈으로"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="screen__body screen__body--notitle">
          ${algoInputs(stats, profile)}
          ${reasonCard}

          <section class="section">
            <div class="section__head">
              <h2 class="section__title">추천 코스 ${rec.courses.length}개</h2>
              <span class="section__hint">난이도별 제시</span>
            </div>
            ${rec.courses.map((c, i) => ui.courseCard(c, {
              highlight: i === 0,
              rankBadge: i === 0 ? '⭐ 맞춤 1순위' : `${i + 1}순위`
            })).join('')}
          </section>

          ${scienceNote}

          <div class="card card--inset">
            <div class="between">
              <div><div class="pattern-tile__label" style="font-size:var(--fs-2xs)">이번 추천 목표 난이도</div>
                <div style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin-top:4px">${(HHC.LEVELS[rec.targetLevel] || {}).label}</div></div>
              <div style="text-align:right"><div class="pattern-tile__label" style="font-size:var(--fs-2xs)">목표 거리</div>
                <div style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin-top:4px" class="num">${rec.targetDistance.toFixed(1)} km</div></div>
            </div>
          </div>
        </div>
      </section>`;
    }
  });

  /* ------------------------------------------------------------------
     추천 코스 상세
     ------------------------------------------------------------------ */
  router.register('course-detail', {
    render(params) {
      const course = HHC.COURSES.find((c) => c.id === params.course) || HHC.COURSES[0];
      const goal = store.buildGoalPlan(course);
      const stats = store.getStats();
      const img = HHC.IMAGES[course.image] || HHC.IMAGES.ridge;
      const level = HHC.LEVELS[course.level];
      const rec = store.recommendNext();
      const matched = rec.courses.find((c) => c.id === course.id);

      return `<section class="screen">
        <div class="screen__body screen__body--flush" style="padding-bottom:calc(var(--nav-height) + var(--sp-5))">
          <div class="course-hero" style="border-radius:0">
            <button class="float-back" data-nav="back" aria-label="뒤로"><i class="fa-solid fa-arrow-left"></i></button>
            <img src="${img}" alt="${HHC.esc(course.region)} 풍경">
            <div class="inline wrap" style="gap:8px;margin-bottom:10px">
              ${ui.levelChip(course.level)}
              <span class="chip chip--sm" style="background:rgba(255,255,255,.2);color:#fff;border:none">${HHC.esc(course.surface)}</span>
            </div>
            <h1 class="course-hero__title">${HHC.esc(course.name)}</h1>
            <p class="course-hero__region"><i class="fa-solid fa-location-dot"></i> ${HHC.esc(course.region)}</p>
          </div>

          <div class="screen__body" style="padding-top:var(--sp-4)">
            <!-- 핵심 지표 -->
            <div class="course-metric-grid">
              <div class="stat-tile"><i class="fa-solid fa-route"></i><div>
                <div class="tile__label">거리</div><div class="tile__value num">${course.distance.toFixed(1)} km</div></div></div>
              <div class="stat-tile"><i class="fa-solid fa-clock"></i><div>
                <div class="tile__label">예상 시간</div><div class="tile__value">${U.fmtDur(course.duration * 60)}</div></div></div>
              <div class="stat-tile"><i class="fa-solid fa-mountain"></i><div>
                <div class="tile__label">고도 상승</div><div class="tile__value num">+${course.ascent} m</div></div></div>
              <div class="stat-tile"><i class="fa-solid fa-fire"></i><div>
                <div class="tile__label">예상 칼로리</div><div class="tile__value num">${course.calories} kcal</div></div></div>
            </div>

            ${matched ? `<div class="card card--ai">
              <div class="card__head" style="margin-bottom:var(--sp-3)">
                <div><span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i>맞춤 추천 이유</span></div>
                <div style="text-align:right"><b class="num" style="font-size:var(--fs-xl)">${Math.round(Math.min(98, matched.matched))}%</b>
                <div class="confidence__label">적합도</div></div>
              </div>
              <p style="font-size:var(--fs-sm);color:rgba(255,255,255,.92);line-height:var(--lh-normal)">${matched.reasonText}</p>
            </div>` : ''}

            <!-- 이번 산행 목표 -->
            <section class="card">
              <div class="card__head" style="margin-bottom:var(--sp-4)">
                <div><h2 class="card__title"><i class="fa-solid fa-bullseye"></i> 이번 산행 목표</h2>
                <p class="card__sub">${stats.hasData ? '과거 기록 기반으로 설정됨' : '입력 정보 기반 기본 목표'}</p></div>
              </div>
              <div class="goal-list">
                <div class="goal-item"><span class="goal-item__icon"><i class="fa-solid fa-route"></i></span>
                  <div><div class="goal-item__label">목표 거리</div><div class="goal-item__value num">${goal.distance.toFixed(1)} km</div></div></div>
                <div class="goal-item"><span class="goal-item__icon"><i class="fa-solid fa-clock"></i></span>
                  <div><div class="goal-item__label">예상 시간</div><div class="goal-item__value">${U.fmtDur(goal.duration * 60)}</div></div></div>
                <div class="goal-item"><span class="goal-item__icon"><i class="fa-solid fa-signal"></i></span>
                  <div><div class="goal-item__label">난이도</div><div class="goal-item__value">${level.label}</div></div></div>
                <div class="goal-item"><span class="goal-item__icon"><i class="fa-solid fa-gauge-high"></i></span>
                  <div><div class="goal-item__label">주요 목표</div><div class="goal-item__value">${HHC.esc(goal.mainGoal)}</div></div></div>
                <div class="goal-item"><span class="goal-item__icon"><i class="fa-solid fa-bottle-water"></i></span>
                  <div><div class="goal-item__label">수분 섭취</div><div class="goal-item__value">${HHC.esc(goal.water)} · ${HHC.esc(goal.waterReminder)}</div></div></div>
              </div>
              ${goal.paceTarget ? `<div class="notice" style="margin-top:var(--sp-4)"><i class="fa-solid fa-gauge"></i>
                <span>목표 페이스 <strong>${U.fmtPace(goal.paceTarget)}</strong> · ${HHC.esc(goal.note)}</span></div>`
                : `<div class="notice notice--muted" style="margin-top:var(--sp-4)"><i class="fa-solid fa-circle-info"></i>
                <span>${HHC.esc(goal.note)}</span></div>`}
            </section>

            <!-- 지도 & 고도 -->
            <section class="card">
              <div class="card__head" style="margin-bottom:var(--sp-3)">
                <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-map-location-dot"></i> 등산로 경로 · 고도 프로필</h2>
                <p class="card__sub">프로토타입 경로 (실제 GPS 미연동)</p></div>
              </div>
              <div class="map-canvas">${HHC.charts.trailMap(0)}</div>
              <div style="margin-top:var(--sp-4)">
                ${HHC.charts.elevation(course.elevation)}
                <div class="elev-legend">
                  <span>출발 0 km</span>
                  <span>최고 고도 ${Math.max.apply(null, course.elevation)} m</span>
                  <span>도착 ${course.distance.toFixed(1)} km</span>
                </div>
              </div>
            </section>

            <!-- 주요 지점 / 위험 구간 -->
            <section class="card">
              <div class="card__head" style="margin-bottom:var(--sp-3)">
                <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-flag"></i> 주요 지점</h2></div>
              </div>
              <ul class="check-list check-list--good">
                ${course.highlights.map((h) => `<li><i class="fa-solid fa-circle-check"></i><span>${HHC.esc(h)}</span></li>`).join('')}
              </ul>
              <div class="divider" style="margin:var(--sp-4) 0"></div>
              <div class="section__hint" style="margin-bottom:8px"><i class="fa-solid fa-triangle-exclamation"></i> 위험 구간</div>
              <ul class="check-list check-list--risk">
                ${course.risks.map((r) => `<li><i class="fa-solid fa-triangle-exclamation"></i><span>${HHC.esc(r)}</span></li>`).join('')}
              </ul>
            </section>

            <!-- 준비 가이드 -->
            <section class="card card--warm">
              <div class="card__head" style="margin-bottom:var(--sp-3)">
                <div><h2 class="card__title" style="font-size:var(--fs-md)"><i class="fa-solid fa-suitcase-rolling"></i> AI 등산 준비 가이드</h2>
                <p class="card__sub">예상 소요 ${U.fmtDur(course.duration * 60)} · 기온 ${HHC.WEATHER.tempMin}°C ~ ${HHC.WEATHER.tempMax}°C</p></div>
              </div>
              <div class="stack-2">
                <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-bottle-water" style="color:var(--color-secondary-500)"></i> 물</span><strong>${HHC.esc(course.water)}</strong></div>
                <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-shirt" style="color:var(--color-secondary-500)"></i> 의복</span><strong>${HHC.esc(course.surface)} 대응</strong></div>
                <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-bowl-food" style="color:var(--color-secondary-500)"></i> 간식</span><strong>에너지바 2개</strong></div>
                <div class="between"><span style="font-size:var(--fs-sm)"><i class="fa-solid fa-lightbulb" style="color:var(--color-secondary-500)"></i> 기타</span><strong>보온 레이어 권장</strong></div>
              </div>
            </section>

            <button class="btn btn--primary btn--lg btn--block" data-go="hiking-setup" data-course="${course.id}">
              <i class="fa-solid fa-person-hiking"></i> 이 코스로 산행 시작
            </button>
          </div>
        </div>
      </section>`;
    }
  });
})();
