/* ==========================================================================
   DEMO — 프로토타입 체험용 상태 생성기
   js/store.js:466-523 (seedDemo) 에서 이동.

   변경점: 상태를 직접 변경하지 않고 { profile, records } 를 "반환"한다.
           저장은 플랫폼 스토어가 담당한다. 생성 값은 변경하지 않았다.

   ISSUE-012: 데모 시드가 프로덕션 번들에 포함된다. 실제 서비스로 갈 때는
              별도 엔트리(개발 빌드 전용)로 분리해야 한다.
   ========================================================================== */
import type { Course, HikeRecord, Profile } from '../types';

export type DemoKind = 'growing' | 'personalized';

export interface DemoSeedInput {
  kind: DemoKind;
  courses: Course[];
  /** 기존 프로필이 있으면 유지한다 (기존 동작과 동일) */
  existingProfile?: Profile | null;
  now?: number;
}

export interface DemoSeedResult {
  profile: Profile;
  records: HikeRecord[];
  onboardedAt: number;
}

const DAY = 86400000;

/** 데모 기록에 쓰이는 코스 순서 (원본과 동일) */
const PICK_FROM = [
  'gyeryong-donghaksa',
  'gwanak-seouluniv',
  'cheonggye-otgol',
  'soyo',
  'surak',
  'gyeryong-donghaksa'
];

export function createDemoState(input: DemoSeedInput): DemoSeedResult {
  const { kind, courses } = input;
  const now = input.now ?? Date.now();
  const gapDays = kind === 'personalized' ? 23 : 21;

  const profile: Profile =
    input.existingProfile ||
    {
      name: '김산행', age: 38, weight: 70, height: 174, gender: 'none', wearable: 'apple',
      experience: 'casual',
      preference: 'moderate',
      goal: 'fitness',
      plan: '2-3w'
    };

  const count = kind === 'personalized' ? 6 : 2;
  const records: HikeRecord[] = [];

  for (let i = 0; i < count; i++) {
    const c = courses.find((x) => x.id === PICK_FROM[i % PICK_FROM.length]);
    if (!c) continue;
    /* 최근 회차일수록 성장 (거리/고도 증가) */
    const growth = kind === 'personalized' ? 1 + (count - i) * 0.035 : 1;
    const dist = Number((c.distance * growth * 0.96).toFixed(2));
    const ascent = Math.round(c.ascent * growth);
    const dur = Math.round(c.duration * 60 * (0.95 + (i % 3) * 0.04));
    const gap = gapDays + (i % 3) * 3;
    records.push({
      id: 'demo_' + i + '_' + Math.random().toString(36).slice(2, 6),
      date: now - gap * DAY * (i + 1) + DAY,
      courseId: c.id,
      name: c.name,
      distance: dist,
      duration: dur,
      ascent: ascent,
      descent: Math.round(ascent * 0.94),
      avgPace: Number((dur / 60 / dist).toFixed(2)),
      calories: Math.round(c.calories * (dist / c.distance)),
      level: c.level,
      maxAlt: Math.max.apply(null, c.elevation),
      paceStability: 70 + i * 4,
      elevation: c.elevation,
      splits: [
        { km: 1, pace: dur / 60 / dist },
        { km: dist, pace: (dur / 60 / dist) * 1.1 }
      ]
    });
  }

  return {
    profile,
    records: records.sort((a, b) => b.date - a.date),
    onboardedAt: now
  };
}
