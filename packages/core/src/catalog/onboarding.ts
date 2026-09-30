/* 온보딩 선택지 — 도메인 열거값 + 표시 문구.
   js/data.js 의 HHC.ONBOARDING 에서 기계적으로 추출했다. 값은 변경하지 않았다.

   ISSUE-005: emoji / title / desc 는 표현 계층에 속하는 한국어 문구다.
   Phase 2 에서 value 만 core 에 남기고 문구는 copy 계층으로 분리한다.
   지금 분리하면 화면 코드가 깨지므로 유지한다. */
import type { OnboardingOptions } from '../types';

export const ONBOARDING: OnboardingOptions = {
  "experience": [
    {
      "value": "new",
      "emoji": "🌱",
      "title": "처음이에요",
      "desc": "등산이 거의 처음이거나 몇 번 안 가봤어요"
    },
    {
      "value": "casual",
      "emoji": "🥾",
      "title": "가끔 가요",
      "desc": "한두 달에 한 번 정도 산행합니다"
    },
    {
      "value": "regular",
      "emoji": "⛰️",
      "title": "자주 가요",
      "desc": "거의 매주 또는 2주에 한 번 산행합니다"
    }
  ],
  "preference": [
    {
      "value": "light",
      "emoji": "🍃",
      "title": "가볍게 걷기",
      "desc": "짧고 완만한 코스가 좋아요"
    },
    {
      "value": "moderate",
      "emoji": "🌿",
      "title": "적당한 난이도",
      "desc": "적당히 오르고 충분히 걸었으면 해요"
    },
    {
      "value": "challenge",
      "emoji": "🏔️",
      "title": "도전적인 산행",
      "desc": "고도 상승과 거리 모두 도전하고 싶어요"
    }
  ],
  "goal": [
    {
      "value": "health",
      "emoji": "💚",
      "title": "건강 관리",
      "desc": "꾸준한 유산소 운동이 목적이에요"
    },
    {
      "value": "fitness",
      "emoji": "💪",
      "title": "체력 향상",
      "desc": "등산으로 기초 체력을 키우고 싶어요"
    },
    {
      "value": "stress",
      "emoji": "🧘",
      "title": "스트레스 해소",
      "desc": "자연 속에서 쉬어가고 싶어요"
    },
    {
      "value": "newcourse",
      "emoji": "🗺️",
      "title": "새로운 코스 도전",
      "desc": "안 가본 산을 계속 찾아보고 싶어요"
    },
    {
      "value": "light",
      "emoji": "🚶",
      "title": "그냥 가볍게 등산",
      "desc": "특별한 목표 없이 즐기고 싶어요"
    }
  ],
  "plan": [
    {
      "value": "week",
      "emoji": "📅",
      "title": "이번 주",
      "desc": "이번 주 안에 산행 예정이에요"
    },
    {
      "value": "2-3w",
      "emoji": "🗓️",
      "title": "2~3주 후",
      "desc": "2~3주 안에 계획하고 있어요"
    },
    {
      "value": "month",
      "emoji": "🌙",
      "title": "한 달 정도 후",
      "desc": "한 달 이내로 생각하고 있어요"
    },
    {
      "value": "unknown",
      "emoji": "💭",
      "title": "아직 모르겠어요",
      "desc": "날짜는 정해지지 않았어요"
    }
  ]
};

/** 선택지 value 에 대응하는 title 을 찾는다. 없으면 fallback. */
export function optionTitle(
  options: { value: string; title: string }[],
  value: string | undefined,
  fallback = '—'
): string {
  const found = options.find((o) => o.value === value);
  return found ? found.title : fallback;
}
