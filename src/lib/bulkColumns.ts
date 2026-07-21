// 엑셀 상품등록 양식 컬럼 정의 (A열부터 순서대로)
export const BULK_HEADERS = [
  "상품링크",
  "상품명",
  "브랜드",
  "카테고리",
  "사이즈",
  "재고",
  "리테일가격",
  "공급가",
  "이미지URL",
  "수수료율(%)",
] as const;

// 다운로드 양식에 넣을 예시 행
export const BULK_EXAMPLE: string[] = [
  "https://viaelite.co.kr/goods/goods_view.php?goodsNo=1000466837",
  "[Stone Island] SS25 Sand Knitwear",
  "Stone Island",
  "니트",
  "S,M,L",
  "3",
  "706000",
  "429900",
  "",
  "10",
];
