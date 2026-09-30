# AI Hiking Health Coach

**산행할 때마다 데이터를 학습해 다음 산행을 더 정교하게 추천하는 AI 등산 코치** — 실제로 클릭하고 사용할 수 있는 모바일 앱 형태의 웹 프로토타입입니다.

> 핵심 메시지: *"매주 산에 가야 하는 앱이 아니라, 사용자가 실제로 산에 갈 때마다 데이터를 학습하여 다음 산행을 더 개인화해서 추천하는 AI 등산 코치"*

첨부 PPTX(`AI Hiking-Health-Coach.pptx`)는 **기능·정보 구조 참고용**으로만 사용했고, UI는 Mountain / Hiking + AI + Health + Modern 방향으로 별도 발전시켰습니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | AI Hiking Health Coach (Prototype v1.0) |
| 목표 | 산행 기록 → AI 분석 → 패턴 학습 → 다음 추천의 **지속적 개인화 순환 구조**를 실제 동작하는 UI로 구현 |
| 기술 스택 | 순수 HTML5 + CSS3 + Vanilla JavaScript (빌드 도구·프레임워크 없음) |
| 데이터 | 프로토타입 mock 데이터 + `localStorage` 상태 저장 (백엔드 서버 없음) |
| 차트 | 외부 라이브러리 없이 직접 구현한 경량 SVG 차트 (고도 프로필 / 스파크라인 / 링 게이지 / 미니 바 / 경로 지도) |
| 아이콘·폰트 | Font Awesome 6, Inter + Noto Sans KR (CDN) |

---

## 2. 핵심 사용자 플로우 (실제 동작)

```
홈 → 나의 산행 데이터 확인 → AI 산행 분석 → 다음 산행 추천
   → 추천 코스 상세 → 산행 시작 → 산행 진행(기록)
   → 산행 종료 → 산행 결과 & AI 피드백 → 데이터 축적
   → 다음 산행 추천이 개인화됨
```

### 상태 순환 엔진 (`js/store.js`)
화면의 숫자는 **박아넣은 값이 아니라 계산값**입니다. 산행을 종료하면:

1. `records` 배열에 기록이 추가되고 (`addRecord`)
2. `getStats()`가 평균 거리 / 평균 고도 / 평균 산행 주기 / 선호 난이도 / 변화율을 **재계산**하며
3. `buildAnalysis()`가 실제 수치 기반으로 AI 피드백 문장을 **다시 생성**하고
4. `recommendNext()`가 다음 코스와 추천 이유를 **다시 계산**합니다.

즉 **산행 완료 → 기록 추가 → 통계 업데이트 → AI 분석 업데이트 → 다음 추천 변경** 흐름이 실제로 연결되어 있습니다.

---

## 3. 신규 사용자 vs 기존 사용자 (3단계 UX 상태)

데이터가 없는데 임의의 평균값을 채우지 않습니다. **실제 상태에 따라 홈 화면이 진화**합니다.

| 상태 | 조건 | 홈 화면 |
|---|---|---|
| ① 신규 사용자 | 기록 0회 | `처음 오셨나요?` 히어로 + **첫 산행 추천받기** CTA + "아직 데이터가 없습니다" 명시 |
| ② 데이터 축적 중 | 1~2회 | `첫 산행을 완료했어요!` 배너 + 최근 산행 + 기본 AI 분석 + 다음 추천 |
| ③ 개인화 활성화 | 3회 이상 | 산행 패턴 분석 + 난이도 변화 + 장기 개선점 + 정교한 다음 추천 |

**첫 실행 플로우**: Splash → 서비스 소개 → 온보딩(4문항) → 기본 정보 입력 → **첫 산행 추천** → 홈

온보딩은 최소 정보만 받습니다:
- Q1 등산 경험 (처음 / 가끔 / 자주)
- Q2 선호 산행 (가볍게 / 적당한 / 도전적)
- Q3 이번 산행 목적 (건강 / 체력 / 스트레스 / 새 코스 / 가볍게)
- Q4 다음 산행 예정 (이번 주 / 2~3주 / 한 달 / 모름)

---

## 4. 구현된 화면 (총 12개)

| # | 화면 | 라우트 | 주요 내용 |
|---|---|---|---|
| 1 | Splash | `splash` | 로고 · 서비스 소개 · 순환 구조 |
| 2 | 서비스 소개 | `intro` | "매주 가야 하는 앱이 아닙니다" + 순환 구조 4단계 |
| 3 | 온보딩 + 기본 정보 | `onboard` | Q1~Q4 + 이름/나이/성별/체중/신장/웨어러블 |
| 4 | 첫 산행 추천 | `first-recommend` | 입력 정보 + 코스 + 날씨 기반 첫 추천 |
| 5 | 홈 / 대시보드 | `home` | 3단계 상태 진화 · 최근 산행 · AI 분석 · 다음 추천 CTA |
| 6 | 다음 산행 추천 | `recommend` | 추천 알고리즘 8개 입력 UI + 추천 이유 + 난이도별 3코스 |
| 7 | 추천 코스 상세 | `course-detail` | 지표 · 이번 산행 목표 · 지도/고도 프로필 · 준비 가이드 |
| 8 | 산행 시작 | `hiking-setup` | 산행 전 체크 · Start Hiking |
| 9 | 산행 진행 | `hiking-live` | 실시간 거리/시간/페이스/고도 · GPS 경로 · Pause/Finish |
| 10 | 산행 결과 | `hike-result` | 거리·시간·고도 + 이전 산행 비교 |
| 11 | AI 산행 분석 | `analysis` | AI 피드백 · 다음 난이도 제안 · 장기 개선점 |
| 12 | 나의 산행 기록 | `records` | 누적 데이터 · 회차별 차트 · 기록 리스트(펼침) |
| 13 | 기록 상세 | `record-detail` | 개별 산행 AI 코멘트 · 구간 페이스 |
| 14 | 나의 산행 패턴 | `patterns` | 학습된 패턴 · 최근 변화 · 다음 추천 반영값 |
| 15 | 마이 / 설정 | `profile` | 프로필 수정 · 개인화 단계 · **디자인 시스템 콘솔** · 데이터 관리 |

모든 화면은 하단 탭(**홈 / 추천 / 산행 / 기록 / 마이**)과 화면 간 이동으로 연결되어 있습니다.

---

## 5. 산행 세션 (핵심 인터랙션)

`js/screens/hiking.js` — GPS가 없어도 **실제 앱처럼 상태 변화가 동작**합니다.

- **Start Hiking** → 1초 타이머 시작, 거리/고도/페이스가 코스 elevation 프로파일을 따라 시뮬레이션
- **Pause / Resume** → 상태 배지(`LIVE` ↔ `일시정지`)와 버튼 레이블이 실제로 전환
- **Finish Hiking** → 확인 시트 → 기록 저장 → 결과 화면
- 진행률 70% 초과 시 **안전 알림**(하산 구간 무릎 부담) 자동 표시
- **SOS 안전** 버튼 (프로토타입 토스트)

---

## 6. 디자인 시스템 (테마 즉시 변경)

디자인은 **CSS 변수 토큰**으로만 구성되어, 토큰만 바꾸면 앱 전체 UI가 함께 바뀝니다.

### 토큰 관리 위치
| 파일 | 역할 |
|---|---|
| `css/tokens.css` | 모든 색상 · radius · shadow · typography · motion 토큰 + 테마 프리셋 |
| `css/components.css` | 토큰 기반 공통 컴포넌트 (버튼/카드/칩/스탯/차트/탭바/시트/폼) |
| `css/base.css` | 리셋 · 앱 셸 · 등고선/능선 장식 그래픽 |
| `css/screens.css` | 화면별 레이아웃 |

### 개별 관리 가능한 토큰
`--color-primary-*`, `--color-secondary-*`, `--color-bg`, `--color-card`, `--color-text`, `--color-accent-*`, `--radius-*`, `--radius-btn`, `--shadow-*`, `--font-*`, `--fs-*` 등

### 마이 화면의 "디자인 시스템 콘솔"에서 실시간 변경
1. **테마 프리셋 5종**: Forest Green · Deep Forest · Navy Trail · Slate Minimal · Midnight(다크)
2. **Primary 색상** 스와치 (기본 / 짙은 그린 / 틸 / 네이비 / 블루 / 올리브 / 브라운)
3. **Secondary 색상** 스와치
4. **버튼 형태(radius)**: Pill / Rounded / Square
5. **카드 스타일 미리보기**: AI 카드 · 날씨 카드 · 준비 가이드 카드

> "초록색을 조금 더 어둡게" → Primary 스와치 1클릭
> "전체를 네이비 + 그린 계열로" → Navy Trail 테마 1클릭

---

## 7. 디자인 방향

- **Primary**: 자연 그린 계열 / **Secondary**: 트레킹 블루 / **Accent**: 데이터 하이라이트
- 흰색 · 밝은 그레이 기반의 깔끔한 UI, 은은한 **등고선(Contour) 배경 패턴**
- 산을 **UI 곳곳에 은은하게**: 등고선 배경, 능선 그래픽(Splash), 트레일 경로 라인(지도), 고도 프로필 그래프
- **카드 성격별 시각 차별화**: AI 추천(다크 그린 그라디언트 · 앱의 핵심 강조) / 산행 기록(화이트) / 통계(inset) / 날씨(스카이) / 준비 가이드(웜)
- 과도한 그라디언트 · 글래스모피즘 · 장식은 배제, 데이터 가독성 우선
- **모바일 우선(Mobile First)** — 하단 네비게이션 · 큰 CTA · 카드형 정보 · 직관적 아이콘
- 데스크톱(≥900px): 화면을 단순 확대하지 않고 **중앙 정렬된 앱 프레임**으로 표시

### 이미지 사용
Hero / 신규 사용자 히어로 / 추천 코스 카드 / 코스 상세에만 **선택적으로** 사용하며, 텍스트 위에는 오버레이로 가독성을 확보했습니다. (CC/PD 라이선스 이미지만 사용)

---

## 8. 디렉터리 구조

```
index.html
css/
  ├── tokens.css      # 디자인 토큰 + 테마 프리셋
  ├── base.css        # 리셋 · 앱 셸 · 장식 그래픽
  ├── components.css  # 공통 컴포넌트
  └── screens.css     # 화면별 스타일
js/
  ├── data.js         # 코스 카탈로그(10개) · 날씨 · 온보딩 옵션
  ├── store.js        # 상태 엔진 (기록→통계→AI분석→추천)
  ├── ui.js           # UI 빌더 · 라우터 · 탭바 · 토스트 · 테마
  ├── charts.js       # SVG 차트 (고도/스파크/링/바/지도)
  ├── app.js          # 부트스트랩 · 이벤트 위임 · 탭 연결
  └── screens/
      ├── onboarding.js  # splash · intro · onboard · first-recommend
      ├── home.js        # 3단계 상태 홈
      ├── recommend.js   # 추천 알고리즘 · 코스 상세
      ├── hiking.js      # 산행 세션 · 결과 · AI 분석
      ├── records.js     # 기록 · 상세 · 패턴
      └── profile.js     # 마이 · 디자인 시스템 콘솔
images/                # CC/PD 라이선스 산행 풍경 이미지
```

---

## 9. 프로토타입 체험 / 개발용 진입점

### 앱 내 체험
**마이 → 프로토타입 체험**
- `데모 데이터 2회 생성` → 상태 ②(데이터 축적 중)
- `데모 데이터 6회 생성` → 상태 ③(개인화 활성화, 산행 주기 23일)
- `모든 데이터 초기화` → 상태 ①(신규 사용자)

### URL 딥링크 (개발·QA용)
| URL | 동작 |
|---|---|
| `index.html` | 정상 시작 (Splash → Intro/Home) |
| `index.html#state=new` | 신규 사용자 상태로 초기화 후 소개 화면 |
| `index.html#state=growing` | 데이터 축적 상태 시드 후 홈 |
| `index.html#state=personalized` | 개인화 상태 시드 후 홈 |
| `index.html#route=recommend` | 추천 화면 직행 |
| `index.html#route=records` | 기록 화면 직행 |
| `index.html#route=analysis` | AI 분석 화면 직행 |

---

## 10. 데이터 모델 (localStorage `hhc.state.v1`)

```jsonc
{
  "profile": {
    "name": "김산행", "age": 38, "gender": "none",
    "weight": 70, "height": 174, "wearable": "apple",
    "experience": "casual",     // new | casual | regular
    "preference": "moderate",   // light | moderate | challenge
    "goal": "fitness",          // health | fitness | stress | newcourse | light
    "plan": "2-3w"              // week | 2-3w | month | unknown
  },
  "records": [{
    "id": "rec_x1y2", "date": 1759000000000,
    "courseId": "gyeryong-donghaksa", "name": "계룡산 동학사 코스",
    "distance": 7.8, "duration": 12000, "ascent": 520, "descent": 489,
    "avgPace": 25.6, "calories": 640, "level": 2, "maxAlt": 601,
    "paceStability": 84, "elevation": [220, 260, ...], "splits": []
  }],
  "prefs": {
    "theme": "default", "buttonShape": "pill",
    "customPrimary": null, "customSecondary": null, "notifications": true
  },
  "ui": { "onboardedAt": 1759000000000, "homeStageSeen": {} }
}
```

### 코스 카탈로그 (`js/data.js`)
실제 산 이름 기반 10개 코스 — 계룡산 동학사 / 북한산 백운대 / 관악산 서울대 / 도봉산 무수골 / 인왕산 / 남산 둘레길 / 설악산 울산바위 / 청계산 옛골 / 수락산 / 소요산
각 코스: 거리 · 예상 시간 · 고도 상승 · 난이도 · 칼로리 · 태그 · 고도 프로파일 · 주요 지점 · 위험 구간

---

## 11. 반응형

| 구간 | 레이아웃 |
|---|---|
| < 900px (모바일) | 풀스크린 앱, 하단 탭바, 하단 시트, 터치 최적화 |
| ≥ 900px (데스크톱) | 중앙 정렬된 앱 프레임(radius·shadow), 내부 스크롤 |

---

## 12. 미구현 / 향후 개발 권장 사항

### 아직 구현되지 않음
- **실제 GPS·웨어러블 연동** — 산행 데이터는 시뮬레이션입니다 (백엔드/네이티브 권한 필요)
- **실제 날씨 API** — 날씨는 mock 데이터입니다 (인증 없는 공개 API 연동 시 교체 가능)
- **실제 LLM 기반 AI 분석** — 현재는 통계 기반 규칙 엔진이 문장을 생성합니다 (API 키가 필요한 LLM 호출은 정적 사이트 범위 밖)
- **서버 데이터 동기화 / 계정 / 다기기 동기화**
- **지도 타일(실제 지형도)** — 현재는 SVG 프로토타입 경로
- **경로 이탈 알림 · 실시간 심박 존** 등 센서 기반 기능

### 권장 다음 단계
1. **RESTful Table API 연동** — `records` / `profile`을 서버 테이블로 옮겨 다기기 동기화
   - 테이블: `hike_records`, `user_profiles` (id 포함)
   - `js/store.js`의 `load/persist`만 fetch 기반으로 교체하면 다른 코드는 그대로 동작
2. **무료 공개 날씨 API** (예: Open-Meteo, 인증 불필요) 로 `HHC.WEATHER` 교체
3. **실제 지도 라이브러리** 도입 (Leaflet + 오픈 지도 타일)로 `charts.trailMap` 대체
4. **디자인 토큰 확장** — Secondary 기반 다크 변형, 브랜드 로고 에셋화
5. **접근성 보강** — 차트 대체 텍스트, 키보드 내비게이션 세부 점검

---

## 13. 알려진 범위 (정직한 한계)

- 이 프로젝트는 **정적 웹 프로토타입**입니다. 서버·DB·인증은 없습니다.
- 입력 정보와 산행 기록은 **브라우저 localStorage**에만 저장되며 외부로 전송되지 않습니다.
- 산행 세션의 거리/고도/페이스는 **물리적으로 그럴듯하게 시뮬레이션**한 값입니다.
- 날씨, 칼로리, 페이스 안정성 등 일부 값은 **mock/prototype 데이터**입니다 (UI에 명시).
