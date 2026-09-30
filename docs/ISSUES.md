# 알려진 이슈

Phase 1(도메인 코어 분리) 과정에서 발견했으나 **의도적으로 고치지 않은** 문제들.
기존 앱 동작을 보존하는 것이 이번 단계의 원칙이었으므로, 전부 기록만 해둔다.

각 항목은 `packages/core/src` 의 해당 위치에 `ISSUE-0NN` 주석으로 표시되어 있다.

| 상태 | 의미 |
|---|---|
| 🔴 결정 필요 | 제품 정책이 정해져야 고칠 수 있다 |
| 🟡 기술 부채 | 정책과 무관하게 고쳐야 하지만 영향 범위가 있다 |
| 🟢 정리 대상 | 안전하게 고칠 수 있다 |

---

## ISSUE-001 🟡 `duration` 단위 불일치 (분 / 초)

`Course.duration` 은 **분**, `HikeRecord.duration` 은 **초**다.

```
packages/core/src/types.ts        Course.duration / HikeRecord.duration
```

화면 여러 곳에서 `course.duration * 60` 으로 변환한다 (`js/ui.js`, `js/screens/recommend.js`,
`js/screens/hiking.js`). 같은 이름의 필드가 다른 단위를 갖는 구조여서, 기능이 확장되면
거의 확실히 버그를 만든다.

**고치는 방법** `durationMin` / `durationSec` 로 이름을 분리하거나 전부 초로 통일.
데이터 마이그레이션이 필요하므로 ISSUE-011 과 함께 처리한다.

---

## ISSUE-002 🟡 분석 문구와 계산의 불일치

`changeRate()` 는 **최근 절반 vs 이전 절반**을 비교하는데, 화면 문구는
"**지난 산행보다** 거리는 약 N% 증가"라고 표현한다.

```
packages/core/src/stats/index.ts      changeRate()
packages/core/src/analysis/index.ts   거리 변화 / 고도 변화 문구
```

기록이 늘어날수록 사용자에게 사실과 다르게 읽힌다.

**고치는 방법** 계산을 문구에 맞추거나(직전 1회 비교), 문구를 계산에 맞춘다
("최근 N회 평균 대비"). 제품 의도 확인이 필요하다.

---

## ISSUE-003 🟡 `elevation` 배열 중복 저장

기록을 저장할 때 코스의 `elevation` 배열을 통째로 복사한다.

```
js/screens/hiking.js   finishSession() → addRecord({ elevation: c.elevation })
packages/core/src/demo/index.ts
```

`courseId` 가 이미 있으므로 참조로 충분하다. 실제 GPS 트래킹이 도입되면 경로 점이
회당 10,000~18,000개가 되므로, 이 구조로는 localStorage 한도를 즉시 초과한다.
→ 모바일 데이터 계층 설계와 함께 처리.

---

## ~~ISSUE-004~~ ✅ 날씨가 고정 문자열 — 해소됨

**결정 (2026-09-30): A + C 조합**

| | 내용 |
|---|---|
| **C** | 기본 예정일은 온보딩 Q4(`profile.plan`)에서 파생한다 |
| **A** | 사용자가 고른 날짜(`prefs.hikeDate`)가 있으면 그것을 우선한다 |
| **+** | 예보 범위(10일)를 넘으면 날씨를 만들어내지 않고 `null` 을 반환한다 |

```
packages/core/src/weather/index.ts     resolveHikeDate · resolveWeather
                                       PLAN_OFFSET_DAYS · FORECAST_HORIZON_DAYS
packages/core/src/fixtures/weather.ts  mockWeatherProvider (교체 대상)
js/data.js                             HHC.WEATHER / HHC.weatherInfo (지연 계산 getter)
```

정책값:

```
plan → 예정일까지 일수      week 3 · 2-3w 18 · month 28 · unknown 21
예보 유효 범위              10일
```

날씨는 `WeatherProvider` 로 주입되므로, **실제 날씨 API 를 붙일 때 core 는
수정하지 않는다** (제공자만 교체).

### 남은 작업 (UI)

`prefs.hikeDate` 슬롯과 core 의 `override` 경로는 준비되었으나, **사용자가 날짜를
고르는 UI 는 아직 만들지 않았다.** UI/UX 를 임의로 늘리지 않기로 한 원칙에 따라
배치 위치(온보딩 / 추천 화면 / 마이)가 정해진 뒤에 붙인다.
그때까지 실질 동작은 C(plan 기반)뿐이다.

---

## ISSUE-005 🔴 도메인 로직이 한국어 문장과 HTML 을 생성

`buildAnalysis()` 는 한국어 문장을, `recommendNext().reasons` 는 `<strong>` 태그를
포함한 HTML 문자열을 반환한다. `ONBOARDING` 도 이모지·제목·설명을 담고 있다.

```
packages/core/src/analysis/index.ts
packages/core/src/recommend/index.ts
packages/core/src/catalog/onboarding.ts
```

이 때문에 다국어, 문구 A/B 테스트, LLM 기반 분석으로 교체, UI 리디자인이 모두
**추천 엔진 코드 수정**을 요구한다.

**Phase 2 작업** `{ code, params }` 구조체 반환 + 별도 copy 계층.
반환 형태를 바꾸면 화면 코드가 깨지므로 Phase 1 에서는 손대지 않았다.

관련: `ui.js` 의 `aiPoints()` 가 `p.text` 를 이스케이프 없이 주입하므로,
서버/사용자 데이터가 이 경로에 들어오면 XSS 가 된다.

### 결정 상태 (2026-09-30)

**문구 생성 방식(A 규칙엔진 / B LLM / C 하이브리드)은 보류.**
아래 로직 제거 후 실제로 남는 추천 · 분석 기능을 보고 다시 판단한다.

**확정 · 반영 완료 — 산행 간격을 난이도 결정 근거로 사용하지 않는다**

삭제한 것:

```
packages/core/src/recommend/index.ts
  - daysSinceLast > avgGap * 1.6  이면 난이도 -0.5
  - avgGap <= 12 이고 상승 추세면 난이도 +0.25
  - "최근 산행 간격 N일로 평소 주기(M일)보다 길어 이전보다 낮은 난이도를 추천합니다."
  - "평소 산행 주기(N일)를 고려해 무리하지 않고 이전과 비슷한 난이도를 추천합니다."
    → "최근 기록이 안정적으로 유지되고 있어 이전과 비슷한 난이도를 추천합니다." 로 교체

packages/core/src/analysis/index.ts
  - "평소 산행 주기는 약 N일인데 이번엔 M일이 지났습니다.
     몸을 다시 적응시키는 관점에서 난이도를 낮춰 추천합니다."

js/screens/recommend.js   추천 알고리즘 입력 카드의 '최근 산행 간격' 행
js/screens/home.js        "N회 기록 + 산행 간격 M일 + 날씨 반영"
                          → "N회 기록 + 최근 체력 추세 + 날씨 반영"
```

난이도는 이제 **체력 추세(`trendDirection`)** 만으로 조정한다.
`avgGap` 은 "학습된 패턴" 과 계획 참고 정보로만 남는다(패턴 화면 · 분석의 주기 안내).

회귀 방지: 스모크 테스트 `산행 간격이 난이도에 영향 없음` 이 경과일 2일 / 200일
두 세트의 `targetLevel` · `targetDistance` 동일성과 삭제 문구 부재를 검사한다.

---

## ISSUE-006 🟢 아이콘 키가 Font Awesome 클래스명에 묶임

`AnalysisPoint.icon` 과 `Weather.icon` 이 `'fa-mountain'`, `'fa-sun'` 같은
Font Awesome 클래스명이다.

```
packages/core/src/analysis/index.ts
packages/core/src/fixtures/weather.ts
```

모바일에서는 Font Awesome 클래스를 쓰지 않으므로 core 가 특정 아이콘 세트에
종속된 상태다. 의미 키(`'trend-up'`) + 플랫폼별 매핑 테이블로 바꿔야 한다.

---

## ISSUE-007 🔴 타임존 정책 없음

`fmtDate()` 가 실행 환경의 로컬 타임존을 그대로 쓴다.

```
packages/core/src/format/index.ts   fmtDate()
```

산행 간격(`avgGap`)과 "오늘/어제" 판정이 기기 타임존에 따라 달라진다.
서버 동기화가 붙으면 기기 간 불일치가 발생한다.

---

## ISSUE-008 🔴 개인화 활성화 기준(3회)이 코드에 하드코딩

```
packages/core/src/stats/index.ts   hasEnoughData / stage
```

제품 정책인데 코드에 있다. 설정으로 분리하고 기준값을 결정해야 한다.

---

## ISSUE-009 🟡 "분석 신뢰도"가 기록 개수의 선형 함수

```
packages/core/src/analysis/index.ts   confidence: Math.min(96, 42 + s.count * 9)
packages/core/src/recommend/index.ts  confidence: Math.min(96, 45 + s.count * 8)
```

데이터 품질·일관성과 무관하게 횟수만 반영한다. 사용자에게 "%"로 제시되고 있어
실제 근거보다 정밀해 보인다.

---

## ISSUE-010 🟡 추천 스코어 계수가 하드코딩

```
packages/core/src/recommend/index.ts
  난이도 차 × 26 / 거리 차 × 30 / 재방문 −12, −26 / 목표 보정 +2~+5
  난이도 조정 ±0.5, +0.25 / 목표 거리 ×1.08, ×0.92, ×1.01
```

튜닝·실험이 불가능하다. 설정 객체로 분리해 주입받아야 한다.

---

## ISSUE-011 🟡 스키마 버전 · 마이그레이션 없음

`mergeState()` 는 `prefs` / `ui` 만 한 단계 병합하는 얕은 머지다.

```
packages/core/src/state/defaults.ts   mergeState()
```

`records[]` 항목에 필드를 추가하거나 구조를 바꾸면 기존 사용자 데이터가 깨진다.
저장 키는 `hhc.state.v1` 이지만 버전 변환 로직이 없다.

---

## ISSUE-012 🟢 데모 시드가 프로덕션 번들에 포함

```
packages/core/src/demo/index.ts
js/screens/profile.js   "프로토타입 체험" 섹션
```

실제 서비스로 갈 때 개발 빌드 전용 엔트리로 분리해야 한다.

---

## ISSUE-013 🟡 저장 실패를 조용히 무시

```
js/store.js   persist() 의 catch 블록
```

localStorage quota 초과 시 아무 일도 하지 않는다. 사용자는 기록이 저장된 줄 안다.

---

## ISSUE-014 🟡 중도 종료 산행이 통계를 오염시킴

진행률 4% 에서 종료한 기록도 정식 record 로 저장되어 평균에 그대로 반영된다.
실측: 6회 기록 상태에서 0.37km 기록을 추가하자 평균 거리 8.0km → 5.9km,
추천 목표 난이도 3 → 2 로 떨어졌다.

```
js/screens/hiking.js   finishSession()
```

최소 완주율 필터, "중단" 플래그, 또는 통계 제외 규칙이 필요하다.
**제품 정책 결정 필요.**

---

## ISSUE-015 🟢 SVG gradient ID 중복

모든 고도 프로필 차트가 `id="elevFill"` 을 사용한다.

```
js/charts.js   elevation()
```

`records` 화면에서 동일 ID 가 6~7개 렌더된다(스모크 테스트가 관측값으로 추적 중).
현재는 색이 같아 증상이 보이지 않지만, 코스별·난이도별 색을 분기하면 전부 깨진다.

---

## ISSUE-016 🟡 `getStats()` / `recommendNext()` 중복 호출

한 화면을 그리는 동안 여러 번 재계산된다.

```
js/screens/home.js:227  recommend.js:54  course-detail:126  analysis:439  patterns:269
```

지금은 기록 수가 적어 문제되지 않지만, 서버 fetch 로 바뀌면 N+1 요청이 된다.
Phase 1 에서 `pickReason()` 이 코스마다 통계를 재계산하지 않도록만 정리했다.

---

## ~~ISSUE-017~~ ✅ 차트가 SVG 문자열을 반환 (플랫폼 종속) — 해소됨

**해소 커밋: charts 기하 분리 작업**

좌표 · path · dasharray 계산을 `packages/core/src/charts/index.ts` 로 옮기고,
`js/charts.js` 는 SVG 마크업만 만드는 렌더러가 되었다. 모바일은 같은 core 함수를
호출해 `react-native-svg` 로 그리면 된다.

계산식은 변경하지 않았다 (28개 경계 케이스 포함 출력 동일성 검증).
남은 플랫폼 종속은 렌더러 쪽의 CSS 변수 색상 · 그라디언트 정의뿐이다.

---

---

## ISSUE-018 🔴 트레일 경로가 코스와 무관한 고정 도형

```
packages/core/src/charts/index.ts   TRAIL_PATH · TRAIL_CONTOURS · trailGeometry()
```

등산로 경로 SVG 가 **모든 코스에 대해 동일한 고정 path** 다. 또한 "현재 위치"
마커가 진행률과 무관하게 항상 출발점(40,150)에 머문다 — 진행률은 경로 위 점선
길이(`stroke-dasharray`)에만 반영된다.

`charts` 분리 작업에서 동작을 그대로 옮기기만 했다.

**결정 필요** 실제 지도를 어떻게 도입할지(지도 라이브러리 · 타일 제공자 ·
오프라인 타일 사전 다운로드)에 따라 이 모듈 전체가 대체된다.
모바일 Primary 전제에서는 오프라인 타일이 필수 요구사항이다.

---

## 참고 — 이번 단계에서 부수적으로 해소된 것

- **`structuredClone` 의존 제거**: `js/store.js` 가 `structuredClone(DEFAULT_STATE)` 대신
  `core.createDefaultState()` 를 호출하므로, Chrome 98+ / iOS 15.4+ 제약이 이 경로에서
  사라졌다. (동작은 동일 — 매 호출마다 새 객체를 만든다)
- **`window.__lastRecordId` 전역 제거** (이전 커밋)
