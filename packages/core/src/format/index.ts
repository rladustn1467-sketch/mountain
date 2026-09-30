/* ==========================================================================
   FORMAT — 표시용 포맷터
   js/store.js:436-464 에서 이동.

   ISSUE-007 (2026-09-30): 날짜 · 일수 계산은 모두 Asia/Seoul 고정 기준이다.
   기기 로컬 타임존을 읽지 않으므로 어느 기기에서 실행해도 같은 결과가 나온다.

   주의: 반환 문자열은 한국어다 (ISSUE-005). Phase 2 에서 locale 주입 구조로
   바꿀 수 있도록 순수 함수로만 유지한다.
   ========================================================================== */
import { kstDayDiff, kstParts } from '../time';

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

/** epoch ms → "2026.09.30" (한국 날짜) */
export function fmtDate(ts: number): string {
  const p = kstParts(ts);
  return `${p.year}.${String(p.month).padStart(2, '0')}.${String(p.day).padStart(2, '0')}`;
}

/** epoch ms → "오늘" / "3일 전" / "2주 전"
 *  한국 달력 기준으로 "날짜가 몇 번 바뀌었는지" 를 센다 (경과 시간이 아니다).
 *  now 를 주입할 수 있게 했다 (테스트 결정성). */
export function fmtRelative(ts: number, now: number = Date.now()): string {
  const days = kstDayDiff(now, ts);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

/** epoch ms → "10월 4일 (토)" — 산행 예정일 표시용 (한국 날짜) */
export function fmtDateWithWeekday(ts: number): string {
  const p = kstParts(ts);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][p.weekday];
  return `${p.month}월 ${p.day}일 (${weekday})`;
}
