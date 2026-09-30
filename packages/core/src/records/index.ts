/* ==========================================================================
   RECORDS — 산행 기록 생성 / 정렬
   js/store.js:67-88 (addRecord 의 기본값 부분) 에서 이동.
   상태 변경(unshift/persist/emit)은 플랫폼 스토어에 남겼다.
   ========================================================================== */
import type { HikeRecord } from '../types';

export interface IdGenerator {
  (): string;
}

/** 기본 id 생성기 — 기존 동작과 동일한 형식 ('rec_' + base36 시각 + 난수) */
export const defaultIdGenerator: IdGenerator = () =>
  'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/**
 * 부분 입력으로부터 완전한 HikeRecord 를 만든다.
 * 필드 기본값은 js/store.js 의 addRecord 와 동일하다.
 */
export function createRecord(
  partial: Partial<HikeRecord>,
  opts: { now?: number; genId?: IdGenerator } = {}
): HikeRecord {
  const genId = opts.genId || defaultIdGenerator;
  return {
    id: genId(),
    date: opts.now ?? Date.now(),
    courseId: null,
    name: '산행',
    distance: 0,
    duration: 0,
    ascent: 0,
    descent: 0,
    avgPace: 0,
    calories: 0,
    level: 2,
    maxAlt: 0,
    paceStability: 0,
    splits: [],
    ...partial
  };
}

/** 최신순(내림차순) 정렬. 원본을 변경하지 않는다. */
export function sortRecordsByDateDesc(records: HikeRecord[]): HikeRecord[] {
  return records.slice().sort((a, b) => b.date - a.date);
}
