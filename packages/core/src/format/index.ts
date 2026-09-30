/* ==========================================================================
   FORMAT — 표시용 포맷터
   js/store.js:436-464 에서 이동. 로직은 변경하지 않았다.

   주의: 반환 문자열은 한국어다 (ISSUE-005). Phase 2 에서 locale 주입 구조로
   바꿀 수 있도록 순수 함수로만 유지한다.
   ========================================================================== */

/** 초 → "2시간 5분" / "35분" */
export function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/** 초 → "02:05:31" */
export function fmtDurClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** 분/km → "25'36\" /km" */
export function fmtPace(minPerKm: number): string {
  if (!minPerKm) return '—';
  const m = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - m) * 60);
  return `${m}'${String(sec).padStart(2, '0')}" /km`;
}

/** epoch ms → "2026.09.30"
 *  ISSUE-007: 실행 환경의 로컬 타임존을 그대로 쓴다. 타임존 정책 미정. */
export function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** epoch ms → "오늘" / "3일 전" / "2주 전"
 *  now 를 주입할 수 있게 했다 (테스트 결정성). 미지정 시 기존 동작과 동일. */
export function fmtRelative(ts: number, now: number = Date.now()): string {
  const days = Math.floor((now - ts) / 86400000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}
