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
  check('[개인화] 데모 시드', () => {
    const s = HHC.store.getStats();
    if (s.stage !== 'personalized') throw new Error(`stage=${s.stage}, 기대 personalized`);
    return `${s.count}회 · 평균 ${s.avgDistance.toFixed(1)}km · 주기 ${s.avgGap.toFixed(0)}일`;
  });
  check('[개인화] 15개 라우트 렌더', () => {
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

  /* ---- 6) 알려진 구조적 이슈 추적 (실패 아님, 관측값) ---- */
  HHC.router.go('records');
  const html = view();
  const dupElevFill = (html.match(/id="elevFill"/g) || []).length;

  /* ---- 7) 전역 오염 검사 ---- */
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
