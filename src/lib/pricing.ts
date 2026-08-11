// 돈버는명품샵 판매가 정책
// 스크래핑해온 원본 판매가에서 일정 비율 낮춰 등록한다(컨시어지/제휴가 근사).
// 정가(listPrice)는 그대로 두고 판매가(salePrice)만 조정한다.
export const CONCIERGE_DISCOUNT_RATE = 0.05; // 5% 낮게

/** 원본 판매가 → 등록 판매가 (5% 낮춤, 10원 단위 반올림) */
export function conciergePrice(raw: number | null | undefined): number | null {
  if (raw == null || raw <= 0) return raw ?? null;
  return Math.round((raw * (1 - CONCIERGE_DISCOUNT_RATE)) / 10) * 10;
}
