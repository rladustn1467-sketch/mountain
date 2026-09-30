/* 난이도 정의 — 라벨 / 정렬 / 색상 레벨
   js/data.js 에서 이동. 값은 변경하지 않았다. */
import type { LevelDef, LevelKey, LevelValue } from './types';

export const LEVELS: Record<LevelValue, LevelDef> = {
  1: { key: 'easy',   label: '초급',   en: 'Easy' },
  2: { key: 'medium', label: '중급',   en: 'Moderate' },
  3: { key: 'hard',   label: '상급',   en: 'Hard' },
  4: { key: 'expert', label: '전문가', en: 'Expert' }
};

export const LEVEL_BY_KEY: Record<LevelKey, LevelValue> = {
  easy: 1, medium: 2, hard: 3, expert: 4
};

/** 1~4 범위로 클램프한다. 계산 결과를 LevelValue 로 좁힐 때 사용. */
export function clampLevel(n: number): LevelValue {
  const v = Math.max(1, Math.min(4, Math.round(n)));
  return v as LevelValue;
}
