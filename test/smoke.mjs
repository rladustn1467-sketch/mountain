/* 회귀 스모크 테스트 — 리팩터링이 기존 동작을 깨뜨리지 않았는지 확인한다.
   실제 브라우저가 아닌 jsdom(DOM 구현) 위에서 앱을 부팅하고,
   모든 라우트 렌더 · 산행 세션 루프 · 테마 적용을 점검한다.

   실행:  npm run smoke
   종료코드 0 = 통과, 1 = 실패 (CI 에 그대로 연결 가능)                     */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'http://localhost:5173';

const ROUTES = [
  'splash', 'intro', 'onboard', 'first-recommend', 'home', 'recommend',
  'course-detail', 'hiking-setup', 'hiking-live', 'hike-result',
  'analysis', 'records', 'record-detail', 'patterns', 'profile'
];

/* jsdom 이 구현하지 않은 API 로 인한 노이즈는 앱 오류와 구분한다 */
const JSDOM_NOISE = /Not implemented: window\.(scrollTo|alert|confirm)/;

const appErrors = [];
const noise = [];

/* CDN(폰트/아이콘)은 건너뛰고 앱 자산만 디스크에서 읽는다 */
class LocalLoader extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(ORIGIN)) return null;
    const rel = decodeURIComponent(url.slice(ORIGIN.length).replace(/^\//, '').split('?')[0]);
    const file = path.join(ROOT, rel);
    if (fs.existsSync(file)) return Promise.resolve(fs.readFileSync(file));
    appErrors.push(`자산 없음: ${rel}`);
    return Promise.reject(new Error('not found: ' + rel));
  }
}

const vc = new VirtualConsole();
const record = (msg) => (JSDOM_NOISE.test(msg) ? noise : appErrors).push(msg);
vc.on('jsdomError', (e) => record(String(e.message || e)));
vc.on('error', (...a) => record('console.error: ' + a.join(' ')));

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), {
  url: `${ORIGIN}/index.html`,
  runScripts: 'dangerously',
  resources: new LocalLoader(),
  pretendToBeVisual: true,
  virtualConsole: vc,
  /* 앱은 structuredClone 을 쓴다 (Chrome 98+ / iOS 15.4+).
     jsdom 에는 없으므로 테스트 환경에만 폴리필을 넣는다. */
  beforeParse(w) {
    if (typeof w.structuredClone !== 'function') {
      w.structuredClone = (o) => JSON.parse(JSON.stringify(o));
    }
  }
});

const results = [];
const check = (name, fn) => {
  try {
    const info = fn();
    results.push({ name, ok: true, info });
  } catch (e) {
    results.push({ name, ok: false, info: e.message });
  }
};

dom.window.addEventListener('load', () => {
  const { window } = dom;
  const HHC = window.HHC;
  const view = () => window.document.getElementById('view').innerHTML;

  check('window.HHC 노출', () => {
    if (!HHC) throw new Error('window.HHC 가 정의되지 않았다');
    return Object.keys(HHC).length + '개 모듈';
  });

  if (!HHC) return report();

  check('코스 카탈로그', () => {
    if (HHC.COURSES.length !== 10) throw new Error(`코스 수 ${HHC.COURSES.length}, 기대 10`);
    return '10개';
  });

  /* ---- 1) 신규 사용자 상태: 전 라우트 렌더 ---- */
  HHC.store.resetAll();
  check('[신규] 15개 라우트 렌더', () => {
    const fail = [];
    for (const r of ROUTES) {
      try {
        HHC.router.go(r);
        if (!view().length) fail.push(`${r}(빈 출력)`);
      } catch (e) { fail.push(`${r}(${e.message})`); }
    }
    if (fail.length) throw new Error(fail.join(', '));
    return '15/15';
  });

  /* ---- 2) 개인화 상태(6회): 전 라우트 렌더 ---- */
  HHC.store.seedDemo('personalized');
  check('[기록 6회] 데모 시드', () => {
    const s = HHC.store.getStats();
    if (s.count !== 6) throw new Error(`count=${s.count}, 기대 6`);
    if ('stage' in s || 'hasEnoughData' in s) {
      throw new Error('제거된 stage / hasEnoughData 가 되살아났다 (ISSUE-008)');
    }
    return `${s.count}회 · 평균 ${s.avgDistance.toFixed(1)}km · 주기 ${s.avgGap.toFixed(0)}일`;
  });
  check('[기록 6회] 15개 라우트 렌더', () => {
    const fail = [];
    for (const r of ROUTES) {
      try {
        HHC.router.go(r);
        if (!view().length) fail.push(`${r}(빈 출력)`);
      } catch (e) { fail.push(`${r}(${e.message})`); }
    }
    if (fail.length) throw new Error(fail.join(', '));
    return '15/15';
  });

  /* ---- 3) 산행 세션 순환 루프 ---- */
  check('산행 루프 (start → tick → finish → 추천 재계산)', () => {
    const before = HHC.store.getStats().count;
    const recBefore = HHC.store.recommendNext().targetLevel;
    HHC.startHike('gyeryong-donghaksa');
    for (let i = 0; i < 12000; i++) HHC.hikeTick();
    const s = HHC.screens.hikingSession;
    const snap = `${s.distance.toFixed(2)}km · +${s.ascent}m · ${s.progress.toFixed(0)}%`;
    HHC.finishHike();
    const after = HHC.store.getStats().count;
    if (after !== before + 1) throw new Error(`기록 ${before}→${after}, 기대 ${before + 1}`);
    const recAfter = HHC.store.recommendNext().targetLevel;
    return `${snap} · 기록 ${before}→${after} · 목표난이도 ${recBefore}→${recAfter}`;
  });

  /* ---- 4) 기록 삭제 후 통계 재계산 ---- */
  check('기록 삭제 → 통계 재계산', () => {
    const recs = HHC.store.get().records;
    const before = recs.length;
    HHC.store.deleteRecord(recs[0].id);
    const after = HHC.store.getStats().count;
    if (after !== before - 1) throw new Error(`${before}→${after}`);
    return `${before}→${after}`;
  });

  /* ---- 5) 테마 프리셋 ---- */
  check('테마 프리셋 5종', () => {
    for (const t of ['default', 'deep-forest', 'navy-trail', 'slate', 'midnight']) {
      HHC.store.setPref('theme', t);
      HHC.theme.apply(HHC.store.get().prefs);
      const applied = window.document.documentElement.getAttribute('data-theme');
      if (applied !== t) throw new Error(`${t} 적용 실패 (data-theme=${applied})`);
    }
    return '5/5';
  });

  /* ---- 5b) 산행 예정일 / 날씨 해석 (ISSUE-004 — A + C) ---- */
  check('예정일 해석 (plan / override / 예보범위)', () => {
    const C = window.HHCCore;
    const NOW = Date.UTC(2026, 8, 30, 3, 0, 0); // 2026-09-30

    const week = C.resolveHikeDate({ plan: 'week', now: NOW });
    if (week.source !== 'plan' || week.daysAhead !== 3) throw new Error(`week → ${week.source}/${week.daysAhead}`);
    if (!week.inForecastRange) throw new Error('week 는 예보 범위 안이어야 한다');

    const mid = C.resolveHikeDate({ plan: '2-3w', now: NOW });
    if (mid.daysAhead !== 18 || mid.inForecastRange) throw new Error('2-3w 는 예보 범위 밖이어야 한다');

    const none = C.resolveHikeDate({ now: NOW });
    if (none.source !== 'default' || none.daysAhead !== 21) throw new Error('plan 없으면 기본 21일');

    /* A — 사용자 지정 날짜가 plan 을 덮어쓴다 */
    const ov = C.resolveHikeDate({ plan: 'month', override: NOW + 5 * 86400000, now: NOW });
    if (ov.source !== 'override' || ov.daysAhead !== 5 || !ov.inForecastRange) {
      throw new Error(`override → ${ov.source}/${ov.daysAhead}`);
    }

    /* 예보 범위 밖이면 날씨를 지어내지 않는다 */
    const inRange = C.resolveWeather({ plan: 'week', now: NOW, provider: C.mockWeatherProvider });
    if (!inRange.weather) throw new Error('범위 안인데 날씨가 없다');
    const outRange = C.resolveWeather({ plan: 'month', now: NOW, provider: C.mockWeatherProvider });
    if (outRange.weather !== null || outRange.unavailableReason !== 'beyond-horizon') {
      throw new Error('범위 밖인데 날씨가 있다');
    }
    /* 날짜 라벨이 고정 문자열이 아니어야 한다 */
    if (inRange.weather.date === '10월 4일 (토)' && week.label !== '10월 4일 (토)') {
      throw new Error('날짜가 대상일에서 파생되지 않았다');
    }
    if (inRange.weather.date !== inRange.target.label) throw new Error('날씨 날짜와 예정일 라벨 불일치');

    return `week=+3일(예보O) · 2-3w=+18일(예보X) · override 우선`;
  });

  /* ---- 5c) 산행 간격은 난이도 결정에 쓰지 않는다 (제품 결정) ---- */
  check('산행 간격이 난이도에 영향 없음', () => {
    const C = window.HHCCore;
    const NOW = Date.UTC(2026, 8, 30, 3, 0, 0);
    const mk = (daysAgo) => daysAgo.map((d, i) => ({
      id: 'r' + i, date: NOW - d * 86400000, courseId: 'gyeryong-donghaksa', name: 'x',
      distance: 7, duration: 7200, ascent: 500, descent: 470,
      avgPace: 17, calories: 600, level: 2, maxAlt: 600, paceStability: 80, splits: []
    }));
    /* 간격 구조는 같고 "마지막 산행 이후 경과일" 만 크게 다른 두 세트 */
    const fresh = mk([2, 25, 50]);    // 2일 전 산행
    const stale = mk([200, 223, 248]); // 200일 전 산행 (평소 주기의 8배)

    const args = (records) => ({
      records, profile: { goal: 'fitness' }, courses: C.COURSES, weather: null, now: NOW
    });
    const a = C.recommendNext(args(fresh));
    const b = C.recommendNext(args(stale));

    if (a.targetLevel !== b.targetLevel) {
      throw new Error(`간격이 난이도를 바꿨다: ${a.targetLevel} vs ${b.targetLevel}`);
    }
    if (a.targetDistance.toFixed(4) !== b.targetDistance.toFixed(4)) {
      throw new Error(`간격이 목표 거리를 바꿨다: ${a.targetDistance} vs ${b.targetDistance}`);
    }

    /* 삭제된 문구가 되살아나지 않도록 */
    const text = [...a.reasons, ...b.reasons,
      ...C.buildAnalysis(fresh, NOW).points.map((p) => p.text),
      ...C.buildAnalysis(stale, NOW).points.map((p) => p.text)].join(' ');
    for (const banned of ['몸을 다시 적응', '주기보다 길어', '보다 길어 ']) {
      if (text.includes(banned)) throw new Error(`삭제된 문구가 남아 있다: "${banned}"`);
    }
    return `난이도 ${a.targetLevel} 동일 · 목표거리 ${a.targetDistance.toFixed(2)}km 동일`;
  });

  /* ---- 5d) 기능별 최소 데이터 조건 (ISSUE-008) ---- */
  check('기능별 데이터 조건 (단계 개념 없음)', () => {
    const C = window.HHCCore;
    const NOW = Date.UTC(2026, 8, 30, 3, 0, 0);
    const mk = (n) => Array.from({ length: n }, (_, i) => ({
      id: 'r' + i, date: NOW - (i * 20 + 1) * 86400000, courseId: 'x', name: 'x',
      distance: 7 + i, duration: 7200, ascent: 500, descent: 470,
      avgPace: 17, calories: 600, level: 2, maxAlt: 600, paceStability: 80, splits: []
    }));

    for (const n of [0, 1, 2, 3, 6]) {
      const s = C.getStats(mk(n), NOW);
      if ('stage' in s || 'hasEnoughData' in s) throw new Error(`${n}회: 제거된 필드가 있다`);
      if (!s.capabilities) throw new Error(`${n}회: capabilities 누락`);
      const c = s.capabilities;
      if (c.canCompareWithPrevious !== (n >= C.MIN_RECORDS_FOR_COMPARISON)) throw new Error(`${n}회: 비교 조건`);
      if (c.canShowSeries !== (n >= C.MIN_RECORDS_FOR_SERIES)) throw new Error(`${n}회: 그래프 조건`);
      if (c.canInferPreferredLevel !== (n >= C.MIN_RECORDS_FOR_PREFERRED_LEVEL)) throw new Error(`${n}회: 선호 난이도 조건`);
      if (c.canAnalyzeTrend !== (n >= C.MIN_RECORDS_FOR_TREND)) throw new Error(`${n}회: 추세 조건`);
    }

    /* 추천 근거에 단계 개념이 없어야 한다 */
    const r = C.recommendNext({
      records: mk(6), profile: {}, courses: C.COURSES, weather: null, now: NOW
    });
    if (!['onboarding', 'records'].includes(r.basis)) throw new Error(`basis=${r.basis}`);
    const text = [...r.reasons, C.buildAnalysis(mk(6), NOW).headline].join(' ');
    for (const banned of ['개인화 단계', '개인화가 활성화', '개인화 활성']) {
      if (text.includes(banned)) throw new Error(`제거된 문구가 남아 있다: "${banned}"`);
    }
    return `조건 5종 · basis=${r.basis}`;
  });

  /* ---- 5e) 날짜 기준은 Asia/Seoul 고정 (ISSUE-007) ---- */
  check('날짜 기준 Asia/Seoul 고정', () => {
    const C = window.HHCCore;
    if (C.TIMEZONE !== 'Asia/Seoul' || C.TZ_OFFSET_MINUTES !== 540) throw new Error('타임존 상수');

    /* 2026-09-30 23:30 KST = 14:30 UTC */
    const kstLateNight = Date.UTC(2026, 8, 30, 14, 30);
    const p = C.kstParts(kstLateNight);
    if (p.year !== 2026 || p.month !== 9 || p.day !== 30 || p.hour !== 23) {
      throw new Error(`kstParts → ${p.year}-${p.month}-${p.day} ${p.hour}시`);
    }
    if (C.fmtDate(kstLateNight) !== '2026.09.30') throw new Error(`fmtDate=${C.fmtDate(kstLateNight)}`);

    /* 경과 2시간이지만 한국 달력으로는 하루가 지났으므로 "어제" */
    const nextDay0130 = Date.UTC(2026, 8, 30, 16, 30); // 2026-10-01 01:30 KST
    if (C.fmtRelative(kstLateNight, nextDay0130) !== '어제') {
      throw new Error(`fmtRelative=${C.fmtRelative(kstLateNight, nextDay0130)}`);
    }
    if (C.kstDayDiff(nextDay0130, kstLateNight) !== 1) throw new Error('kstDayDiff');

    /* 날짜 입력 컨트롤 왕복 */
    const v = C.toKstDateInputValue(kstLateNight);
    if (v !== '2026-09-30') throw new Error(`toKstDateInputValue=${v}`);
    const back = C.fromKstDateInputValue(v);
    if (C.kstStartOfDay(kstLateNight) !== back) throw new Error('날짜 왕복 불일치');
    if (C.fromKstDateInputValue('bad') !== null) throw new Error('잘못된 형식은 null');

    return 'KST 고정 · 달력일 기준 · 입력 왕복 OK';
  });

  /* ---- 6) 차트 기하 골든 검증 ----
     core 로 옮긴 좌표 계산이 이후 리팩터링에서 바뀌지 않도록 값을 고정한다.
     계산을 의도적으로 개선할 때는 이 기대값도 함께 갱신할 것. */
  check('차트 기하 (core 골든값)', () => {
    const C = window.HHCCore;
    const e = C.elevationGeometry([220, 260, 318, 390, 452, 510, 548, 601, 573, 512]);
    const expectLine = 'M8.0 112.0 L44.0 101.1 L80.0 85.2 L116.0 65.6 L152.0 48.7 '
      + 'L188.0 32.8 L224.0 22.5 L260.0 8.0 L296.0 15.6 L332.0 32.3';
    if (e.linePath !== expectLine) throw new Error('elevation linePath 불일치');
    if (e.areaPath !== `${expectLine} L 332.0 120 L 8.0 120 Z`) throw new Error('elevation areaPath 불일치');
    if (e.min !== 220 || e.max !== 601 || e.range !== 381 || e.peakIndex !== 7) throw new Error('elevation 스칼라 불일치');
    if (e.gridY[0] !== 39.6 || e.gridY[1] !== 79.2) throw new Error('elevation gridY 불일치');

    const s = C.sparklineGeometry([5, 7, 6, 9, 8, 11]);
    if (s.linePath !== 'M6.0 48.0 L63.6 34.0 L121.2 41.0 L178.8 20.0 L236.4 27.0 L294.0 6.0') {
      throw new Error('sparkline linePath 불일치');
    }
    if (C.sparklineGeometry([]) !== null) throw new Error('sparkline 빈 입력은 null 이어야 한다');

    const r = C.ringGeometry(42.7);
    if (r.radius !== 60.5 || r.display !== 43) throw new Error('ring 스칼라 불일치');
    if (r.dash.toFixed(1) !== '162.3' || r.circumference.toFixed(1) !== '380.1') throw new Error('ring dash 불일치');
    if (C.ringGeometry(180).pct !== 100 || C.ringGeometry(-25).pct !== 0) throw new Error('ring 클램프 불일치');

    const b = C.barsGeometry([{ label: 'a', short: '#1', value: 7.2 }, { label: 'b', short: '#2', value: 9.4 }]);
    if (b.max !== 9.4 || b.items[0].heightPct.toFixed(1) !== '76.6' || b.items[1].heightPct !== 100) {
      throw new Error('bars 불일치');
    }

    const t = C.trailGeometry(37.4);
    if (t.totalLength !== 340 || t.dash.toFixed(2) !== '127.16') throw new Error('trail dash 불일치');
    if (C.trailGeometry(undefined).progress !== 0) throw new Error('trail 기본 진행률 불일치');

    return '5종 · 기하값 고정';
  });

  /* ---- 7) 차트 렌더러가 core 기하를 사용하는지 ---- */
  check('차트 렌더러 출력', () => {
    const svg = HHC.charts.elevation([100, 300, 200]);
    const geo = window.HHCCore.elevationGeometry([100, 300, 200]);
    if (!svg.includes(geo.linePath)) throw new Error('렌더 결과에 core 의 linePath 가 없다');
    if (HHC.charts.sparkline([]) !== '') throw new Error('빈 스파크라인은 빈 문자열이어야 한다');
    if (!HHC.charts.bars([{ label: '<img>', short: 'a', value: 1 }]).includes('&lt;img&gt;')) {
      throw new Error('bars label 이스케이프 누락');
    }
    return 'elevation · sparkline · bars 확인';
  });

  /* ---- 8) 알려진 구조적 이슈 추적 (실패 아님, 관측값) ---- */
  HHC.router.go('records');
  const html = view();
  const dupElevFill = (html.match(/id="elevFill"/g) || []).length;

  /* ---- 9) 전역 오염 검사 ---- */
  check('전역 오염 없음 (window.HHC 외)', () => {
    const leaked = ['__lastRecordId'].filter((k) => k in window);
    if (leaked.length) throw new Error('window.' + leaked.join(', window.'));
    return 'clean';
  });

  report({ dupElevFill, svgCount: (html.match(/<svg/g) || []).length });
});

function report(observed) {
  const pad = Math.max(...results.map((r) => r.name.length));
  console.log('\n── 스모크 테스트 ' + '─'.repeat(40));
  for (const r of results) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(pad)}  ${r.info}`);
  }

  if (observed) {
    console.log('\n── 관측값 (알려진 이슈 추적) ' + '─'.repeat(28));
    console.log(`  records 화면 SVG ${observed.svgCount}개 / 중복 id="elevFill" ${observed.dupElevFill}개`);
  }

  if (noise.length) {
    console.log(`\n  (jsdom 미구현 API 경고 ${noise.length}건 — 실제 브라우저에서는 발생하지 않음)`);
  }

  const failed = results.filter((r) => !r.ok);
  if (appErrors.length) {
    console.log('\n── 앱 오류 ' + '─'.repeat(46));
    appErrors.forEach((e) => console.log('  ERR  ' + e));
  }

  const ok = !failed.length && !appErrors.length;
  console.log(`\n  ${ok ? '통과' : '실패'} — 검사 ${results.length}건 중 ${failed.length}건 실패, 앱 오류 ${appErrors.length}건\n`);
  process.exit(ok ? 0 : 1);
}

setTimeout(() => {
  console.log('\n  실패 — 타임아웃 (25초)\n');
  process.exit(1);
}, 25000);
