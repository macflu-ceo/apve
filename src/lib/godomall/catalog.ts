// 고도몰 상품 카탈로그(목록) 연동 — MD 상품 선별용
// 고도몰 커스텀 API(es_goods 직접 조회)에서 상품 목록을 필터·정렬해 가져온다.
//   엔드포인트: https://api.viaelite.co.kr/concierge/catalog
//   응답: { count, list:[{ goodsNo, goodsNm, brand, sellPrice, listPrice, costPrice,
//                          marginAmt, marginRate, salesQty, views, wish, stock, soldOut, isNew, ... }] }
//
// 브랜드=makerNm(텍스트), 재고=totalStock, 인기=orderGoodsCnt.
// 공급가(costPrice)·마진은 내부 운영용이므로 소비자 화면엔 절대 노출 금지.

const API_BASE = process.env.GODO_SALES_API_URL || "https://api.viaelite.co.kr/concierge/sales";
const API_KEY = process.env.GODO_SALES_API_KEY || "";

/** catalog 엔드포인트 URL (sales URL에서 경로만 교체) */
function catalogUrl(): string {
  return API_BASE.replace(/\/sales$/, "/catalog");
}

export type CatalogSort = "new" | "sales" | "margin" | "priceHigh" | "priceLow";

export interface CatalogFilters {
  newDays?: number; // 최근 N일 등록 신상만 (0/미지정=전체)
  brand?: string; // 브랜드명 부분일치
  tag?: string; // 검색태그(naverTag) 부분일치 — 예: 국내배송
  minMargin?: number; // 최소 마진율 %
  inStock?: boolean; // 품절 제외
  sort?: CatalogSort; // 정렬 (기본 new)
  limit?: number; // 최대 200
  page?: number; // 1부터
}

export interface CatalogItem {
  goodsNo: string;
  goodsNm: string;
  brand: string; // 제조사=브랜드 (makerNm)
  origin: string; // 원산지
  brandCd: string;
  searchTag: string; // 검색태그(naverTag) — 예: "국내배송"
  sellPrice: number; // 판매가
  listPrice: number; // 정가(시중가)
  costPrice: number; // 공급가(매입원가) — 내부용
  marginAmt: number; // 마진액
  marginRate: number; // 마진율 %
  salesQty: number; // 누적 주문수량(인기)
  views: number; // 조회수
  wish: number; // 찜
  stock: number; // 총 재고
  soldOut: boolean;
  isNew: boolean;
  regDt: string;
  viewUrl: string;
}

export interface CatalogResult {
  count: number;
  page: number;
  limit: number;
  sort: CatalogSort;
  list: CatalogItem[];
}

/** 고도몰 상품 카탈로그 조회 */
export async function fetchCatalog(filters: CatalogFilters = {}): Promise<CatalogResult> {
  const url = new URL(catalogUrl());
  if (filters.newDays && filters.newDays > 0) url.searchParams.set("newDays", String(filters.newDays));
  if (filters.brand) url.searchParams.set("brand", filters.brand);
  if (filters.tag) url.searchParams.set("tag", filters.tag);
  if (filters.minMargin && filters.minMargin > 0) url.searchParams.set("minMargin", String(filters.minMargin));
  if (filters.inStock) url.searchParams.set("inStock", "1");
  if (filters.sort) url.searchParams.set("sort", filters.sort);
  url.searchParams.set("limit", String(Math.min(Math.max(filters.limit ?? 50, 1), 200)));
  url.searchParams.set("page", String(Math.max(filters.page ?? 1, 1)));

  const res = await fetch(url.toString(), {
    headers: { "X-API-KEY": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`카탈로그 API 오류 (${res.status})`);
  const data = await res.json();
  if (data?.error) throw new Error(`카탈로그 API: ${data.message || data.error}`);

  const list: CatalogItem[] = Array.isArray(data?.list)
    ? data.list.map((r: CatalogItem) => ({ ...r, goodsNo: String(r.goodsNo) }))
    : [];

  return {
    count: Number(data?.count ?? list.length),
    page: Number(data?.page ?? filters.page ?? 1),
    limit: Number(data?.limit ?? filters.limit ?? 50),
    sort: (data?.sort as CatalogSort) ?? filters.sort ?? "new",
    list,
  };
}

/** "국내배송" 검색태그가 달린 상품들의 goodsNo 집합 (페이지 넘겨가며 전부 수집) */
export async function fetchDomesticGoodsNos(): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 1; page <= 30; page++) {
    const r = await fetchCatalog({ tag: "국내배송", limit: 200, page });
    for (const i of r.list) {
      // searchTag(naverTag)에 "국내배송"이 실제로 포함된 것만 (부분일치 오탐 방지)
      if ((i.searchTag ?? "").includes("국내배송")) set.add(i.goodsNo);
    }
    if (r.list.length < 200) break; // 마지막 페이지
  }
  return set;
}

/**
 * 등록된 상품 전체의 가격(정가·판매가)을 카탈로그 API로 최신화한다.
 * 이탈리아 부티크 창고 연동으로 리테일가/할인가가 수시로 바뀌므로, 재고 새로고침과 함께 사용.
 * 판매가는 컨시어지가 정책(원본가 -5%)을 그대로 적용한다.
 */
export async function refreshPrices(): Promise<{ targeted: number; priced: number; errors: number }> {
  const { prisma } = await import("@/lib/db");
  const { conciergePrice } = await import("@/lib/pricing");

  // 1) 카탈로그 전체 페이지 수집 → goodsNo → 가격 맵
  const priceMap = new Map<string, { sellPrice: number; listPrice: number }>();
  for (let page = 1; page < 100; page++) {
    const r = await fetchCatalog({ limit: 200, page });
    for (const it of r.list) priceMap.set(it.goodsNo, { sellPrice: it.sellPrice, listPrice: it.listPrice });
    if (r.list.length < 200 || priceMap.size >= r.count) break;
  }

  // 2) 우리 상품과 대조해 달라진 것만 갱신
  const products = await prisma.product.findMany({ select: { id: true, goodsNo: true, listPrice: true, salePrice: true } });
  const result = { targeted: products.length, priced: 0, errors: 0 };
  for (const p of products) {
    const src = priceMap.get(p.goodsNo);
    if (!src || !src.sellPrice) continue; // 카탈로그에 없거나 가격 0 → 건너뜀
    const newSale = conciergePrice(src.sellPrice);
    const newList = src.listPrice || p.listPrice;
    if (newSale === p.salePrice && newList === p.listPrice) continue; // 변동 없음
    try {
      await prisma.product.update({ where: { id: p.id }, data: { salePrice: newSale, listPrice: newList } });
      result.priced++;
    } catch {
      result.errors++;
    }
  }
  return result;
}
