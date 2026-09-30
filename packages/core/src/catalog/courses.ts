/* 코스 카탈로그 — 실제 산 이름 기반 10개 코스.
   js/data.js 의 HHC.COURSES 에서 기계적으로 추출했다. 값은 변경하지 않았다.
   향후 서버/CMS 가 원본이 되면 이 파일은 타입과 기본 시드만 남긴다. */
import type { Course } from '../types';

export const COURSES: Course[] = [
  {
    "id": "gyeryong-donghaksa",
    "name": "계룡산 동학사 코스",
    "region": "충남 공주 · 계룡산",
    "distance": 7.8,
    "duration": 200,
    "ascent": 520,
    "level": 2,
    "calories": 640,
    "image": "valley",
    "tags": [
      "숲길",
      "계곡",
      "사찰"
    ],
    "surface": "흙길 · 계단",
    "water": "1.5L",
    "highlights": [
      "동학사 → 삼불봉 능선",
      "관음봉 조망 포인트",
      "등산로 정비 양호"
    ],
    "risks": [
      "삼불봉 구간 바위 계단 미끄럼 주의"
    ],
    "elevation": [
      220,
      260,
      318,
      390,
      452,
      510,
      548,
      601,
      573,
      512,
      448,
      383,
      322,
      268,
      236
    ]
  },
  {
    "id": "bukhansan-baegundae",
    "name": "북한산 백운대 코스",
    "region": "서울 강북 · 북한산",
    "distance": 8.4,
    "duration": 230,
    "ascent": 760,
    "level": 3,
    "calories": 820,
    "image": "peak",
    "tags": [
      "암릉",
      "조망",
      "도전"
    ],
    "surface": "암반 · 흙길",
    "water": "2.0L",
    "highlights": [
      "백운대 정상 836m",
      "서울 시내 전망",
      "노적봉 조망"
    ],
    "risks": [
      "암릉 구간 로프 필요",
      "정상부 혼잡"
    ],
    "elevation": [
      120,
      190,
      285,
      390,
      470,
      560,
      648,
      726,
      794,
      836,
      742,
      610,
      470,
      320,
      160
    ]
  },
  {
    "id": "gwanak-seouluniv",
    "name": "관악산 서울대 코스",
    "region": "서울 관악 · 관악산",
    "distance": 6.8,
    "duration": 170,
    "ascent": 480,
    "level": 2,
    "calories": 560,
    "image": "mist",
    "tags": [
      "근교",
      "조망",
      "바위"
    ],
    "surface": "흙길 · 암반",
    "water": "1.2L",
    "highlights": [
      "연주대 조망",
      "서울대 후문 출발",
      "접근성 우수"
    ],
    "risks": [
      "연주대 직전 급경사"
    ],
    "elevation": [
      95,
      150,
      225,
      300,
      372,
      432,
      490,
      542,
      505,
      448,
      380,
      300,
      215,
      150,
      100
    ]
  },
  {
    "id": "dobong-musugol",
    "name": "도봉산 무수골 코스",
    "region": "서울 도봉 · 도봉산",
    "distance": 9.2,
    "duration": 250,
    "ascent": 820,
    "level": 3,
    "calories": 900,
    "image": "ridge",
    "tags": [
      "장거리",
      "계곡",
      "체력"
    ],
    "surface": "흙길 · 계곡",
    "water": "2.0L",
    "highlights": [
      "무수골 계곡",
      "신선대 능선",
      "오봉 조망"
    ],
    "risks": [
      "구간 길이 김 — 체력 배분 필요"
    ],
    "elevation": [
      110,
      175,
      250,
      340,
      445,
      540,
      636,
      720,
      790,
      830,
      720,
      560,
      400,
      240,
      130
    ]
  },
  {
    "id": "inwangsan",
    "name": "인왕산 사직터널 코스",
    "region": "서울 종로 · 인왕산",
    "distance": 4.2,
    "duration": 110,
    "ascent": 320,
    "level": 1,
    "calories": 330,
    "image": "fog",
    "tags": [
      "짧은 산행",
      "도심",
      "초보"
    ],
    "surface": "흙길 · 성곽길",
    "water": "0.8L",
    "highlights": [
      "서울 성곽길",
      "인왕산 범바위",
      "도심 전망"
    ],
    "risks": [
      "성곽길 좁은 구간"
    ],
    "elevation": [
      80,
      118,
      160,
      205,
      248,
      285,
      318,
      336,
      300,
      255,
      205,
      155,
      112,
      88,
      78
    ]
  },
  {
    "id": "namsan-dulle",
    "name": "남산 둘레길",
    "region": "서울 중구 · 남산",
    "distance": 5.1,
    "duration": 100,
    "ascent": 180,
    "level": 1,
    "calories": 300,
    "image": "fog",
    "tags": [
      "둘레길",
      "가벼운 산책",
      "초보"
    ],
    "surface": "둘레길 · 데크",
    "water": "0.7L",
    "highlights": [
      "남산순환로",
      "N서울타워",
      "야경 포인트"
    ],
    "risks": [
      "위험 구간 거의 없음"
    ],
    "elevation": [
      60,
      78,
      95,
      112,
      130,
      145,
      158,
      166,
      158,
      140,
      122,
      104,
      88,
      74,
      62
    ]
  },
  {
    "id": "seorak-ulsanbawi",
    "name": "설악산 울산바위 코스",
    "region": "강원 속초 · 설악산",
    "distance": 11.5,
    "duration": 320,
    "ascent": 1050,
    "level": 4,
    "calories": 1180,
    "image": "chiangrai",
    "tags": [
      "장거리",
      "대경사",
      "전문"
    ],
    "surface": "암반 계단 · 흙길",
    "water": "2.5L",
    "highlights": [
      "울산바위 정상",
      "설악 전경",
      "신선대 능선"
    ],
    "risks": [
      "연속된 계단 — 무릎 부담 큼",
      "구간 등반 시간 김"
    ],
    "elevation": [
      180,
      260,
      355,
      470,
      590,
      720,
      850,
      950,
      1020,
      1050,
      900,
      700,
      500,
      320,
      200
    ]
  },
  {
    "id": "cheonggye-otgol",
    "name": "청계산 옛골 코스",
    "region": "경기 성남 · 청계산",
    "distance": 6.2,
    "duration": 160,
    "ascent": 470,
    "level": 2,
    "calories": 520,
    "image": "valley",
    "tags": [
      "근교",
      "숲길",
      "적당"
    ],
    "surface": "흙길 · 계단",
    "water": "1.2L",
    "highlights": [
      "옛골 계곡",
      "매봉 조망",
      "수도권 근교"
    ],
    "risks": [
      "매봉 직전 급경사"
    ],
    "elevation": [
      105,
      155,
      220,
      290,
      358,
      415,
      462,
      490,
      452,
      400,
      335,
      262,
      190,
      140,
      108
    ]
  },
  {
    "id": "surak",
    "name": "수락산 코스",
    "region": "서울 노원 · 수락산",
    "distance": 7.1,
    "duration": 190,
    "ascent": 640,
    "level": 3,
    "calories": 700,
    "image": "mist",
    "tags": [
      "암릉",
      "조망",
      "중상급"
    ],
    "surface": "흙길 · 암릉",
    "water": "1.6L",
    "highlights": [
      "수락산 기차바위",
      "동막골 계곡",
      "서울 전망"
    ],
    "risks": [
      "기차바위 구간 미끄럼 주의"
    ],
    "elevation": [
      100,
      165,
      245,
      330,
      420,
      505,
      580,
      630,
      605,
      540,
      455,
      360,
      255,
      175,
      115
    ]
  },
  {
    "id": "soyo",
    "name": "소요산 코스",
    "region": "경기 동두천 · 소요산",
    "distance": 5.6,
    "duration": 150,
    "ascent": 430,
    "level": 2,
    "calories": 450,
    "image": "valley",
    "tags": [
      "초중급",
      "사찰",
      "숲길"
    ],
    "surface": "흙길 · 계단",
    "water": "1.0L",
    "highlights": [
      "자재암",
      "소요산 정상",
      "완만한 초입"
    ],
    "risks": [
      "정상부 계단 구간"
    ],
    "elevation": [
      90,
      135,
      190,
      250,
      312,
      368,
      415,
      442,
      410,
      355,
      295,
      225,
      165,
      120,
      92
    ]
  }
];

/** id 로 코스를 찾는다. 없으면 첫 번째 코스로 폴백 (기존 앱 동작과 동일). */
export function findCourse(courses: Course[], id: string | null | undefined): Course {
  return courses.find((c) => c.id === id) || courses[0];
}
