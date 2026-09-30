/* ==========================================================================
   TIME — 날짜 기준은 Asia/Seoul 고정
   --------------------------------------------------------------------------
   ISSUE-007 결정 (2026-09-30):
     이 앱은 국내 산행 중심이므로 모든 날짜 · 일별 계산을 한국 시간으로 한다.

       · 오늘 / 어제 / 며칠 전        → 한국 시간 기준
       · 산행 기록의 날짜 계산         → 한국 시간 기준
       · 일별 통계 · 날짜 기반 데이터  → 한국 시간 기준
       · 기록별 timezone 저장          → 하지 않음
       · GPS 기반 timezone 처리        → 하지 않음

   구현 메모:
     KST 는 서머타임이 없고 1961년 이후 UTC+9 로 고정이므로, 고정 오프셋
     산술로 충분하다. Intl / 타임존 DB 에 의존하지 않으므로 React Native
     (Hermes) 처럼 Intl 이 제한된 런타임에서도 그대로 동작한다.

     기기 로컬 타임존은 읽지 않는다. 기기를 어디에 두고 실행해도 결과가 같다.
   ========================================================================== */

/** 서비스 기준 타임존 (표시 · 문서용) */
export const TIMEZONE = 'Asia/Seoul';

/** KST = UTC+9. 서머타임 없음 */
export const TZ_OFFSET_MINUTES = 540;

const DAY = 86400000;
const OFFSET_MS = TZ_OFFSET_MINUTES * 60000;

export interface KstParts {
  year: number;
  /** 1~12 */
  month: number;
  /** 1~31 */
  day: number;
  /** 0=일 … 6=토 */
  weekday: number;
  hour: number;
  minute: number;
}

/** epoch ms → 한국 시간 기준 달력 필드 */
export function kstParts(ts: number): KstParts {
  const d = new Date(ts + OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes()
  };
}

/**
 * 한국 시간 기준 "일 번호".
 * 두 시각이 한국 달력에서 며칠 떨어져 있는지 계산할 때 쓴다.
 */
export function kstDayIndex(ts: number): number {
  return Math.floor((ts + OFFSET_MS) / DAY);
}

/** 한국 시간 기준 그날 자정의 epoch ms */
export function kstStartOfDay(ts: number): number {
  return kstDayIndex(ts) * DAY - OFFSET_MS;
}

/**
 * 한국 달력 기준 일수 차이 (a - b).
 * 경과 시간이 아니라 "날짜가 몇 번 바뀌었는지" 를 센다.
 * 예) 23:00 산행 → 다음날 01:00 조회 = 1일 (경과 2시간이지만 하루 지남)
 */
export function kstDayDiff(a: number, b: number): number {
  return kstDayIndex(a) - kstDayIndex(b);
}

/** 한국 시간 기준으로 같은 날인가 */
export function isSameKstDay(a: number, b: number): boolean {
  return kstDayIndex(a) === kstDayIndex(b);
}

/* --------------------------------------------------------------------------
   날짜 입력 컨트롤(<input type="date">) 변환 — 한국 시간 기준
   -------------------------------------------------------------------------- */

/** epoch ms → "YYYY-MM-DD" (한국 날짜) */
export function toKstDateInputValue(ts: number): string {
  const p = kstParts(ts);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" → 그 한국 날짜 자정의 epoch ms. 형식이 틀리면 null */
export function fromKstDateInputValue(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return Date.UTC(y, mo - 1, d) - TZ_OFFSET_MINUTES * 60000;
}
