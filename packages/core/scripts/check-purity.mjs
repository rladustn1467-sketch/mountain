/* core 순수성 검사 — 브라우저 전용 API 가 core 에 들어오지 못하게 막는다.
   모바일 Primary 전제에서 core 는 React Native 런타임에서도 그대로 돌아야 한다.

   실행:  npm run lint:purity -w @hhc/core   (또는 루트에서 npm run check) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

/* 금지 식별자 — 단어 경계로 검사한다 */
const FORBIDDEN = [
  'window', 'document', 'localStorage', 'sessionStorage', 'navigator',
  'location', 'alert', 'confirm', 'fetch', 'XMLHttpRequest',
  'HTMLElement', 'requestAnimationFrame', 'setInterval', 'setTimeout'
];

/* 주석과 문자열 리터럴은 검사 대상에서 제외한다 (설명에 단어가 등장할 수 있음) */
function strip(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   // 블록 주석
    .replace(/\/\/[^\n]*/g, ' ')          // 라인 주석
    .replace(/`(?:\\[\s\S]|\$\{[^}]*\}|[^`\\])*`/g, '``')  // 템플릿 리터럴
    .replace(/'(?:\\.|[^'\\])*'/g, "''")  // 단일 인용
    .replace(/"(?:\\.|[^"\\])*"/g, '""'); // 이중 인용
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const violations = [];
for (const file of walk(SRC)) {
  const lines = strip(fs.readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    for (const id of FORBIDDEN) {
      if (new RegExp(`\\b${id}\\b`).test(line)) {
        violations.push(`${path.relative(SRC, file)}:${i + 1}  ${id}`);
      }
    }
  });
}

const rel = path.relative(process.cwd(), SRC);
if (violations.length) {
  console.log(`\n  core 순수성 위반 ${violations.length}건 (${rel})\n`);
  violations.forEach((v) => console.log('    ' + v));
  console.log('\n  core 는 플랫폼 API 를 참조할 수 없다. 호출 측(어댑터)으로 옮길 것.\n');
  process.exit(1);
}
console.log(`  core 순수성 OK — 브라우저 전용 API 참조 0건 (검사 ${FORBIDDEN.length}종)`);
