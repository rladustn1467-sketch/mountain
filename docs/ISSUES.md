# 알려진 이슈

Phase 1(도메인 코어 분리) 과정에서 발견했으나 **의도적으로 고치지 않은** 문제들.
기존 앱 동작을 보존하는 것이 이번 단계의 원칙이었으므로, 전부 기록만 해둔다.

각 항목은 `packages/core/src` 의 해당 위치에 `ISSUE-0NN` 주석으로 표시되어 있다.

| 상태 | 의미 |
|---|---|
| 🔴 결정 필요 | 제품 정책이 정해져야 고칠 수 있다 |
| 🟡 기술 부채 | 정책과 무관하게 고쳐야 하지만 영향 범위가 있다 |
| 🟢 정리 대상 | 안전하게 고칠 수 있다 |
| ⏸ 보류 | 검토 중. **구현하지 않는다** |
| ✅ | 결정 · 반영 완료 |

---

## ⏸ 보류 중 — 결정 전까지 구현하지 않을 것

| 항목 | 내용 |
|---|---|
| **스키마 변경 · 마이그레이션** | 개별 ISSUE 를 결정하는 즉시 진행하지 않는다. 관련 ISSUE 전체의 검토와 제품 요구사항 결정이 끝난 뒤 **한 번에** 정리한다. 현재 코드의 스키마에 맞추려고 성급히 필드를 추가하지 않는다. → ISSUE-001 · 003 · 011 · 014 |
| **산행 목표 지점 구조** | ISSUE-014 의 ①②③ (난이도 영향 여부 · 목표 지점 데이터 모델 · 추천 단위) |
| **AI 문구 생성 방식** | ISSUE-005 의 규칙엔진 / LLM / 하이브리드 선택. 로직 정리 후 남는 기능을 보고 판단 |
| **예보 없음 기본 표시** | ISSUE-004. 화면 흐름과 데이터 연동 상태를 확인한 뒤 결정 |
| **산행 예정일 선택 UI 위치** | ISSUE-004. 이동 가능한 구조로 구현되어 있음 (`ui.hikeDatePicker()` 호출 한 줄) |
| **추세 분석 최소 기록 수** | ISSUE-008. 현재 3 (기존 값 승계), 통계적으로는 4 가 타당 |

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

## ~~ISSUE-007~~ ✅ 타임존 정책 없음 — 해소됨

**결정 (2026-09-30): `Asia/Seoul` 고정**

이 앱은 국내 산행 중심이므로 기기 로컬 타임존이나 산행 지점의 timezone 을
사용하거나 저장하지 않는다.

| 항목 | 기준 |
|---|---|
| 날짜 · 시간 | Asia/Seoul |
| 오늘 / 어제 / 며칠 전 | 한국 시간 |
| 산행 기록의 날짜 계산 | 한국 시간 |
| 일별 통계 · 날짜 기반 데이터 | 한국 시간 |
| 기록별 timezone 저장 | **하지 않음** |
| GPS 기반 timezone 처리 | **하지 않음** |

```
packages/core/src/time/index.ts   kstParts · kstDayIndex · kstStartOfDay
                                  kstDayDiff · isSameKstDay
                                  toKstDateInputValue · fromKstDateInputValue
packages/core/src/format/index.ts fmtDate · fmtRelative · fmtDateWithWeekday → KST
packages/core/src/stats/index.ts  gaps · daysSinceLast → 한국 달력일 차이
packages/core/src/weather/index.ts 예정일 자정 → 한국 시간
```

**스키마 변경 없음.** 기록은 계속 epoch ms 만 저장하고, 달력 해석만 KST 로 고정했다.

구현 메모: KST 는 서머타임이 없고 UTC+9 고정이므로 고정 오프셋 산술로 처리했다.
`Intl` / 타임존 DB 에 의존하지 않아 React Native(Hermes)에서도 그대로 동작한다.

부수 효과 — `fmtRelative` 가 경과 시간이 아니라 **날짜가 몇 번 바뀌었는지**를 센다.
밤 11시 산행을 다음날 새벽 1시에 보면 이전에는 "오늘", 이제는 "어제" 로 나온다.

`avgGap` / `daysSinceLast` 도 달력일 기준으로 바뀌었다(같은 날 중복 제외 조건이
`>= 0.5` → `>= 1`). 두 값은 **난이도 결정에 쓰지 않는다** — 표시와 계획 참고용이다.

> 기존 ISSUE 본문에 있던 *"평균 산행 주기가 핵심 지표이고 추천 난이도를 직접
> 바꾼다"* 는 서술은 현재 제품 요구사항과 맞지 않아 삭제했다.
> 산행 주기에 따라 난이도를 하향하는 로직은 사용하지 않는다.

---

## ~~ISSUE-008~~ ✅ "개인화 활성화" 개념 — 제거됨

**결정 (2026-09-30)**

이 앱은 기록 3회가 쌓인 뒤부터 개인화되는 서비스가 **아니다.**
온보딩에서 받은 정보로 **첫 산행부터 개인화된 추천**을 제공하는 것이 기본이고,
기록이 쌓이면 개인화에 쓸 수 있는 데이터가 늘어나는 구조다.

따라서 삭제한 것:

- `stage` (`'new'` / `'growing'` / `'personalized'`) 3단계 상태
- `hasEnoughData` (`count >= 3`) 단일 게이트
- "개인화 활성화" 라는 상태 전환 개념 전체
- 3회 / 5회 임계값을 산행 주기와 연결하는 서술

### 제거 전 "3회" 가 무엇을 gate 하고 있었는가 (조사 결과)

| 위치 | 실제로 막고 있던 기능 | 처리 |
|---|---|---|
| `stats.hasEnoughData` | 아래 항목들의 공통 게이트 | 삭제 |
| `stats.stage` | 홈 배너 · 마이 단계 카드 · 패턴 칩 · 분석 배지 · 추천 안내 | 삭제 |
| `analysis.headline` | "산행 패턴이 개인화 단계에 들어섰습니다." | 문구 삭제 |
| `recommend.basis` | `'personalized'` / `'partial'` 라벨. `pickReason` 은 `'basic'` 만 검사했으므로 **실제 분기에 영향 없음** | `'onboarding'` / `'records'` 로 단순화 |
| `hiking.js` 분석 배지 | '개인화 분석' / '기본 분석' / '기준선 분석' | 1회=기준선, 그 외 '산행 분석' |
| `hiking.js` 장기 개선점 섹션 | 최근 절반 vs 이전 절반 추세 표 + 스파크라인 | `canAnalyzeTrend` 로 대체 |
| `profile.js` 개인화 단계 카드 | 3단계 목록 + `count / 3` 진행바 | 카드 교체 (아래) |
| `records.js` 패턴 칩 | '개인화 활성' / '축적 중' | `N회 기록` 으로 교체 |
| `recommend.js` 안내 | "3회 이상 쌓이면 난이도 변화 추세까지 반영됩니다" | 추세 조건 안내로 교체 |

### 대체 구조 — 기능별 최소 데이터 조건

```
packages/core/src/stats/index.ts
  MIN_RECORDS_FOR_COMPARISON      2   이전 산행 대비 델타
  MIN_RECORDS_FOR_SERIES          2   회차별 그래프 (스파크라인 · 미니바)
  MIN_RECORDS_FOR_PREFERRED_LEVEL 2   선호 난이도 (최빈값)
  MIN_RECORDS_FOR_TREND           3   추세 · 장기 변화 분석
  MIN_GAPS_FOR_INTERVAL           1   평균 산행 주기
```

`getStats().capabilities` 가 `{ canCompareWithPrevious, canShowSeries,
canInferPreferredLevel, canAnalyzeTrend, canEstimateInterval }` 를 돌려준다.
임계값은 위 상수 한곳에만 있고, **산행 주기와 연결하지 않는다.**

`profile.js` 의 단계 카드는 "산행 데이터" 카드로 교체했다 — 현재 기록 수와
**각 분석에 필요한 최소 조건**을 보여준다(정보를 없애지 않기 위한 대체안이며,
카드 자체를 삭제하는 쪽이 낫다면 그렇게 바꿀 수 있다).

### 남은 결정 사항

`MIN_RECORDS_FOR_TREND = 3` 은 **기존 임계값을 그대로 승계**한 값이다.
`changeRate()` 가 "최근 절반 vs 이전 절반" 을 비교하므로 3회에서는 이전 절반이
1건뿐이다. 통계적으로는 양쪽에 2건씩 들어가는 **4** 가 더 타당하다 — 값 변경은
별도 결정 사항으로 남긴다.

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

## ISSUE-014 ⏸ 산행 목표 지점 구조 — 검토 중 (구현 보류)

### 관측된 현상

진행률 4% 에서 종료한 기록도 정식 record 로 저장되어 평균에 그대로 반영된다.
실측: 6회 기록 상태에서 0.37km 기록을 추가하자 평균 거리 8.0km → 5.9km,
추천 목표 난이도 3 → 2 로 떨어졌다.

### 폐기된 접근 (적용하지 않음)

최소 완주율 필터(예: 30% 미만 저장 안 함), `aborted` 플래그로 통계 제외,
완주율 가중 평균 — **모두 적용하지 않는다.** 완주율 기반 정책을 쓰지 않는다.

### 제품 방향 (2026-09-30)

1. **각 산행은 기본적으로 독립적인 산행이다.**
   - 이전 산행에서 정상까지 가지 못했다는 이유만으로 다음 산행 난이도를
     자동으로 낮추지 않는다.
   - `중도 하산 = 실패 = 난이도 하향` 로직은 사용하지 않는다.

2. **"중도 하산" 과 "목표 미달성" 은 같지 않다.**
   - 처음부터 정상이 아니라 특정 중간 지점까지만 가는 산행도 정상적인 산행이다.
   - 따라서 산행 시작 시 **이번 산행의 목표 지점 / 목표 범위**를 설정할 수 있어야 한다.

3. **추천도 "정상까지" 만 제시하지 않는다.**
   - 정상까지 / 특정 전망대·쉼터까지 / 코스 중간 지점까지 등 목표 지점을
     설정할 수 있어야 한다.

4. **기록은 실제 산행 데이터를 보존한다.**
   - 실제 이동 거리 · 실제 소요 시간 · 실제 도달 지점
   - **산행 당시 설정한 목표 지점과 실제 도달 지점을 구분**할 수 있어야 한다.

### 현재 코드에서 수정이 필요한 지점 (조사 결과 · 미구현)

| # | 위치 | 현재 상태 | 필요한 것 |
|---|---|---|---|
| 1 | `catalog/courses.ts` `Course.highlights` | "동학사 → 삼불봉 능선" 같은 자유 텍스트. 거리 · 고도 · 소요시간이 없어 목표 지점으로 쓸 수 없다 | 코스 내 도달 지점 목록 (이름 · 누적 거리 · 고도 · 예상 소요 · 지점 종류) |
| 2 | `js/screens/hiking.js` `session` | 목표 지점 개념이 없다. `hiking-setup` → 즉시 시작. `buildGoalPlan()` 은 페이스 · 수분 가이드이며 도달 지점 목표가 아니다 | 산행 시작 시 목표 지점 선택, 세션에 보관 |
| 3 | `recommend/index.ts` | 코스 3개만 고른다. 코스 = 정상까지로 암묵 가정. `targetDistance` 를 계산하지만 "어디까지" 로 연결되지 않는다 | 추천 단위를 (코스 + 목표 지점) 조합으로 확장. 스코어링 입력도 함께 바뀐다 |
| 4 | `types.ts` `HikeRecord` | 실제 distance/duration/ascent 는 보존하지만 목표 지점 · 실제 도달 지점 · 목표 달성 여부가 없다. `level` 은 코스 난이도를 복사한 값이라 실제 수행 난이도가 아니다 | 목표 지점과 실제 도달 지점을 각각 보존 → **스키마 변경 (보류)** |
| 5 | `stats/index.ts` | `avgLevel` 은 코스 난이도 평균, `preferredLevel` 은 그 최빈값, `trendDirection` 은 목표가 다른 산행끼리의 거리 · 고도 비교 | 목표 지점 도입 후 입력 정의를 재검토 |

### ⏸ 미결정 — 구현하지 않는다

| | 내용 |
|---|---|
| **①** | **이전 산행 결과가 다음 추천 난이도에 영향을 주는가** |
| **②** | 목표 지점의 데이터 모델 (코스에 지점 목록 / 사용자가 임의 거리 지정) |
| **③** | 추천 단위 (코스 단위 / 코스 + 목표 지점 조합) |

**①에 관한 사실 기록:** 현재 코드는 `avgLevel`(코스 난이도 평균)과
`trendDirection`(실제 거리 · 고도 추세)을 통해 **이전 산행 결과가 다음 추천
난이도에 영향을 주고 있다.** 이는 명시적인 "중도 하산 → 하향" 규칙이 아니라
평균 · 추세 계산의 부작용이다. ① 이 결정될 때까지 **이 로직은 건드리지 않는다.**

관련 요구사항과 산행 흐름을 모두 정리한 뒤 ①②③ 및 스키마 변경을
**한 번에** 결정한다.

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
