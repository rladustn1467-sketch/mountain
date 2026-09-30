/* ==========================================================================
   ANALYSIS — 통계로부터 AI 피드백 문장을 생성
   js/store.js:204-276 에서 이동. 규칙과 문구는 변경하지 않았다.

   변경점은 시그니처뿐:
     before  buildAnalysis()                 // 모듈 내부 state 를 읽음
     after   buildAnalysis(records, now?)    // 인자로 받음 (순수 함수)

   제품 결정 (2026-09-30):
     산행 간격이 평소보다 길다는 이유로 난이도를 낮춰 추천한다는 문구를 삭제했다.
     삭제된 문구 — "평소 산행 주기는 약 N일인데 이번엔 M일이 지났습니다.
                    몸을 다시 적응시키는 관점에서 난이도를 낮춰 추천합니다."
     간격은 계획 참고 정보로만 남는다.

   ISSUE-005: 한국어 문장을 직접 만들어 반환한다. 다국어 · 문구 A/B ·
              LLM 교체를 위해서는 { code, params } 구조로 바꿔야 하지만,
              반환 형태를 바꾸면 화면 코드가 깨지므로 Phase 2 로 미룬다.
   ISSUE-006: icon 값이 Font Awesome 클래스명에 묶여 있다.
   ========================================================================== */
import type { Analysis, AnalysisPoint, HikeRecord } from '../types';
import { hasStatsData } from '../types';
import { getStats } from '../stats';
import { fmtDur } from '../format';

export function buildAnalysis(records: HikeRecord[], now: number = Date.now()): Analysis {
  const s = getStats(records, now);

  if (!hasStatsData(s)) {
    return { headline: '아직 분석할 산행 데이터가 없습니다.', points: [], confidence: 0 };
  }

  const p: AnalysisPoint[] = [];
  const first = s.last;

  if (s.count === 1) {
    p.push({
      icon: 'fa-flag-checkered',
      text: `첫 산행을 완료했습니다. ${first.distance.toFixed(1)}km · ${fmtDur(first.duration)} · +${Math.round(first.ascent)}m 기록이 AI 학습의 시작점이 됩니다.`
    });
    p.push({ icon: 'fa-brain', text: '아직 비교할 이전 데이터가 없어 이번 기록을 기준선(baseline)으로 저장했습니다.' });
    p.push({ icon: 'fa-route', text: '다음 산행부터 이 기준선과 비교해 난이도를 조정해 추천합니다.' });
    return { headline: '첫 산행 데이터를 분석했습니다.', points: p, confidence: 1, baseline: true };
  }

  /* 거리 변화 */
  const d = s.distanceTrend;
  if (Math.abs(d) >= 1) {
    p.push({
      icon: d > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down',
      text: `지난 산행보다 거리는 약 ${Math.abs(d).toFixed(0)}% ${d > 0 ? '증가' : '감소'}했습니다.`
    });
  } else {
    p.push({ icon: 'fa-equals', text: '거리는 지난 산행과 거의 동일하게 유지되었습니다.' });
  }

  /* 고도 변화 */
  const a = s.ascentTrend;
  if (Math.abs(a) >= 2) {
    p.push({
      icon: a > 0 ? 'fa-mountain' : 'fa-mountain-sun',
      text: `고도 상승량은 약 ${Math.abs(a).toFixed(0)}% ${a > 0 ? '늘었습니다' : '줄었습니다'}. ${a > 0 ? '오르막 적응력이 향상되고 있습니다.' : '체력 배분을 다시 점검해 보세요.'}`
    });
  }

  /* 페이스 안정성 */
  if (s.paceStability >= 75) {
    p.push({
      icon: 'fa-wave-square',
      text: `오르막 구간에서 평균 페이스가 안정적으로 유지되었습니다 (안정성 ${Math.round(s.paceStability)}/100).`
    });
  } else if (s.paceStability > 0) {
    p.push({
      icon: 'fa-wave-square',
      text: `구간별 페이스 편차가 있습니다 (안정성 ${Math.round(s.paceStability)}/100). 초반 속도를 조금 줄여보세요.`
    });
  }

  /* 산행 간격 기반 조언 — "빈도 학습" 표현.
     간격은 계획 참고용 정보로만 쓴다. 난이도 조정 근거로는 쓰지 않는다 (제품 결정). */
  if (s.avgGap !== null) {
    const gapTxt = s.avgGap.toFixed(0);
    if (s.avgGap <= 10 && s.trendDirection === 'up') {
      p.push({
        icon: 'fa-dumbbell',
        text: `최근 약 ${gapTxt}일 간격으로 꾸준히 산행하고 있습니다. 같은 난이도에서 페이스를 더 끌어올려 볼 수 있습니다.`
      });
    } else {
      p.push({
        icon: 'fa-clock-rotate-left',
        text: `평소 산행 주기는 약 ${gapTxt}일입니다. 이 주기를 기준으로 다음 산행을 계획하면 무리 없이 유지할 수 있습니다.`
      });
    }
  }

  /* 다음 난이도 제안 */
  if (s.trendDirection === 'up') {
    p.push({ icon: 'fa-arrow-up-right-dots', text: '다음 산행에서는 현재 난이도를 유지하거나 약간 높은 난이도에 도전할 수 있습니다.' });
  } else if (s.trendDirection === 'down') {
    p.push({ icon: 'fa-shield-heart', text: '최근 기록이 다소 낮아졌습니다. 다음 산행은 비슷하거나 조금 낮은 난이도로 회복하는 것을 권장합니다.' });
  } else {
    p.push({ icon: 'fa-scale-balanced', text: '현재 난이도를 유지하면서 거리나 고도를 조금씩 늘려가는 단계입니다.' });
  }

  return {
    headline: s.hasEnoughData ? '산행 패턴이 개인화 단계에 들어섰습니다.' : '산행 데이터를 분석했습니다.',
    points: p,
    /* ISSUE-009: 신뢰도가 기록 개수의 선형 함수일 뿐이다 */
    confidence: Math.min(96, 42 + s.count * 9)
  };
}
