/* ==========================================================================
   DATA — 코스 카탈로그 / 날씨 / 온보딩 옵션
   백엔드 없이 동작하는 프로토타입용 mock 데이터셋입니다.
   ========================================================================== */
window.HHC = window.HHC || {};

HHC.IMAGES = {
  ridge: 'images/hero-ridge.jpg',
  peak: 'images/course-peak.jpg',
  valley: 'images/course-valley.jpg',
  chiangrai: 'images/course-chiangrai.jpg',
  mist: 'images/course-mist.jpg',
  fog: 'images/course-fog.jpg'
};

/* 난이도 정의 — 라벨/정렬/색상 레벨 */
HHC.LEVELS = {
  1: { key: 'easy',   label: '초급',  en: 'Easy' },
  2: { key: 'medium', label: '중급',  en: 'Moderate' },
  3: { key: 'hard',   label: '상급',  en: 'Hard' },
  4: { key: 'expert', label: '전문가', en: 'Expert' }
};

/* 난이도 key → 숫자 */
HHC.LEVEL_BY_KEY = { easy: 1, medium: 2, hard: 3, expert: 4 };

/* --------------------------------------------------------------------------
   코스 카탈로그
   -------------------------------------------------------------------------- */
HHC.COURSES = [
  {
    id: 'gyeryong-donghaksa',
    name: '계룡산 동학사 코스',
    region: '충남 공주 · 계룡산',
    distance: 7.8, duration: 200, ascent: 520, level: 2, calories: 640,
    image: 'valley',
    tags: ['숲길', '계곡', '사찰'],
    surface: '흙길 · 계단',
    water: '1.5L',
    highlights: ['동학사 → 삼불봉 능선', '관음봉 조망 포인트', '등산로 정비 양호'],
    risks: ['삼불봉 구간 바위 계단 미끄럼 주의'],
    elevation: [220, 260, 318, 390, 452, 510, 548, 601, 573, 512, 448, 383, 322, 268, 236]
  },
  {
    id: 'bukhansan-baegundae',
    name: '북한산 백운대 코스',
    region: '서울 강북 · 북한산',
    distance: 8.4, duration: 230, ascent: 760, level: 3, calories: 820,
    image: 'peak',
    tags: ['암릉', '조망', '도전'],
    surface: '암반 · 흙길',
    water: '2.0L',
    highlights: ['백운대 정상 836m', '서울 시내 전망', '노적봉 조망'],
    risks: ['암릉 구간 로프 필요', '정상부 혼잡'],
    elevation: [120, 190, 285, 390, 470, 560, 648, 726, 794, 836, 742, 610, 470, 320, 160]
  },
  {
    id: 'gwanak-seouluniv',
    name: '관악산 서울대 코스',
    region: '서울 관악 · 관악산',
    distance: 6.8, duration: 170, ascent: 480, level: 2, calories: 560,
    image: 'mist',
    tags: ['근교', '조망', '바위'],
    surface: '흙길 · 암반',
    water: '1.2L',
    highlights: ['연주대 조망', '서울대 후문 출발', '접근성 우수'],
    risks: ['연주대 직전 급경사'],
    elevation: [95, 150, 225, 300, 372, 432, 490, 542, 505, 448, 380, 300, 215, 150, 100]
  },
  {
    id: 'dobong-musugol',
    name: '도봉산 무수골 코스',
    region: '서울 도봉 · 도봉산',
    distance: 9.2, duration: 250, ascent: 820, level: 3, calories: 900,
    image: 'ridge',
    tags: ['장거리', '계곡', '체력'],
    surface: '흙길 · 계곡',
    water: '2.0L',
    highlights: ['무수골 계곡', '신선대 능선', '오봉 조망'],
    risks: ['구간 길이 김 — 체력 배분 필요'],
    elevation: [110, 175, 250, 340, 445, 540, 636, 720, 790, 830, 720, 560, 400, 240, 130]
  },
  {
    id: 'inwangsan',
    name: '인왕산 사직터널 코스',
    region: '서울 종로 · 인왕산',
    distance: 4.2, duration: 110, ascent: 320, level: 1, calories: 330,
    image: 'fog',
    tags: ['짧은 산행', '도심', '초보'],
    surface: '흙길 · 성곽길',
    water: '0.8L',
    highlights: ['서울 성곽길', '인왕산 범바위', '도심 전망'],
    risks: ['성곽길 좁은 구간'],
    elevation: [80, 118, 160, 205, 248, 285, 318, 336, 300, 255, 205, 155, 112, 88, 78]
  },
  {
    id: 'namsan-dulle',
    name: '남산 둘레길',
    region: '서울 중구 · 남산',
    distance: 5.1, duration: 100, ascent: 180, level: 1, calories: 300,
    image: 'fog',
    tags: ['둘레길', '가벼운 산책', '초보'],
    surface: '둘레길 · 데크',
    water: '0.7L',
    highlights: ['남산순환로', 'N서울타워', '야경 포인트'],
    risks: ['위험 구간 거의 없음'],
    elevation: [60, 78, 95, 112, 130, 145, 158, 166, 158, 140, 122, 104, 88, 74, 62]
  },
  {
    id: 'seorak-ulsanbawi',
    name: '설악산 울산바위 코스',
    region: '강원 속초 · 설악산',
    distance: 11.5, duration: 320, ascent: 1050, level: 4, calories: 1180,
    image: 'chiangrai',
    tags: ['장거리', '대경사', '전문'],
    surface: '암반 계단 · 흙길',
    water: '2.5L',
    highlights: ['울산바위 정상', '설악 전경', '신선대 능선'],
    risks: ['연속된 계단 — 무릎 부담 큼', '구간 등반 시간 김'],
    elevation: [180, 260, 355, 470, 590, 720, 850, 950, 1020, 1050, 900, 700, 500, 320, 200]
  },
  {
    id: 'cheonggye-otgol',
    name: '청계산 옛골 코스',
    region: '경기 성남 · 청계산',
    distance: 6.2, duration: 160, ascent: 470, level: 2, calories: 520,
    image: 'valley',
    tags: ['근교', '숲길', '적당'],
    surface: '흙길 · 계단',
    water: '1.2L',
    highlights: ['옛골 계곡', '매봉 조망', '수도권 근교'],
    risks: ['매봉 직전 급경사'],
    elevation: [105, 155, 220, 290, 358, 415, 462, 490, 452, 400, 335, 262, 190, 140, 108]
  },
  {
    id: 'surak',
    name: '수락산 코스',
    region: '서울 노원 · 수락산',
    distance: 7.1, duration: 190, ascent: 640, level: 3, calories: 700,
    image: 'mist',
    tags: ['암릉', '조망', '중상급'],
    surface: '흙길 · 암릉',
    water: '1.6L',
    highlights: ['수락산 기차바위', '동막골 계곡', '서울 전망'],
    risks: ['기차바위 구간 미끄럼 주의'],
    elevation: [100, 165, 245, 330, 420, 505, 580, 630, 605, 540, 455, 360, 255, 175, 115]
  },
  {
    id: 'soyo',
    name: '소요산 코스',
    region: '경기 동두천 · 소요산',
    distance: 5.6, duration: 150, ascent: 430, level: 2, calories: 450,
    image: 'valley',
    tags: ['초중급', '사찰', '숲길'],
    surface: '흙길 · 계단',
    water: '1.0L',
    highlights: ['자재암', '소요산 정상', '완만한 초입'],
    risks: ['정상부 계단 구간'],
    elevation: [90, 135, 190, 250, 312, 368, 415, 442, 410, 355, 295, 225, 165, 120, 92]
  }
];

/* --------------------------------------------------------------------------
   날씨 mock — 추천 예정일(다음 주말) 기준
   -------------------------------------------------------------------------- */
HHC.WEATHER = {
  date: '10월 4일 (토)',
  condition: '맑음',
  icon: 'fa-sun',
  tempMin: 8,
  tempMax: 15,
  humidity: 52,
  rain: 10,
  wind: 2.4,
  air: '보통',
  summary: '산행하기 좋은 날씨입니다. 아침 기온이 낮아 보온 레이어를 권장합니다.'
};

/* --------------------------------------------------------------------------
   온보딩 선택지
   -------------------------------------------------------------------------- */
HHC.ONBOARDING = {
  experience: [
    { value: 'new',    emoji: '🌱', title: '처음이에요',   desc: '등산이 거의 처음이거나 몇 번 안 가봤어요' },
    { value: 'casual', emoji: '🥾', title: '가끔 가요',    desc: '한두 달에 한 번 정도 산행합니다' },
    { value: 'regular',emoji: '⛰️', title: '자주 가요',    desc: '거의 매주 또는 2주에 한 번 산행합니다' }
  ],
  preference: [
    { value: 'light',   emoji: '🍃', title: '가볍게 걷기',   desc: '짧고 완만한 코스가 좋아요' },
    { value: 'moderate',emoji: '🌿', title: '적당한 난이도', desc: '적당히 오르고 충분히 걸었으면 해요' },
    { value: 'challenge',emoji:'🏔️', title: '도전적인 산행', desc: '고도 상승과 거리 모두 도전하고 싶어요' }
  ],
  goal: [
    { value: 'health',    emoji: '💚', title: '건강 관리',       desc: '꾸준한 유산소 운동이 목적이에요' },
    { value: 'fitness',   emoji: '💪', title: '체력 향상',       desc: '등산으로 기초 체력을 키우고 싶어요' },
    { value: 'stress',    emoji: '🧘', title: '스트레스 해소',   desc: '자연 속에서 쉬어가고 싶어요' },
    { value: 'newcourse', emoji: '🗺️', title: '새로운 코스 도전', desc: '안 가본 산을 계속 찾아보고 싶어요' },
    { value: 'light',     emoji: '🚶', title: '그냥 가볍게 등산', desc: '특별한 목표 없이 즐기고 싶어요' }
  ],
  plan: [
    { value: 'week',  emoji: '📅', title: '이번 주',        desc: '이번 주 안에 산행 예정이에요' },
    { value: '2-3w',  emoji: '🗓️', title: '2~3주 후',       desc: '2~3주 안에 계획하고 있어요' },
    { value: 'month', emoji: '🌙', title: '한 달 정도 후',  desc: '한 달 이내로 생각하고 있어요' },
    { value: 'unknown',emoji:'💭', title: '아직 모르겠어요', desc: '날짜는 정해지지 않았어요' }
  ]
};
