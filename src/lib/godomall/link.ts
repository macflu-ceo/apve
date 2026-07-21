// 고도몰 판매 링크 생성 유틸
// 핵심: 상품 URL 뒤에 파트너 고유 파라미터(code)를 붙인다.
//   https://viaelite.co.kr/goods/goods_view.php?goodsNo=<번호>&code=<파트너코드>

const BASE = process.env.GODOMALL_BASE_URL ?? "https://viaelite.co.kr";

/** goodsNo로 기본 상품 URL 생성 (파라미터 없음) */
export function productUrl(goodsNo: string): string {
  return `${BASE}/goods/goods_view.php?goodsNo=${encodeURIComponent(goodsNo)}`;
}

/** "내 코드 만들기" — 파트너 코드가 붙은 판매 링크 생성 */
export function partnerLink(goodsNo: string, partnerCode: string): string {
  return `${productUrl(goodsNo)}&code=${encodeURIComponent(partnerCode)}`;
}

/** 임의의 고도몰 상품 URL에서 goodsNo 추출 */
export function extractGoodsNo(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("goodsNo");
  } catch {
    // URL 파싱 실패 시 정규식 폴백
    const m = url.match(/goodsNo=(\d+)/);
    return m ? m[1] : null;
  }
}
