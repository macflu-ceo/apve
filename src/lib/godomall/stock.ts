// 상품 옵션/사이즈별 재고 연동
// 고도몰 커스텀 API(es_goodsOption 직접 조회)에서 사이즈별 재고를 가져온다.
//   엔드포인트: https://api.viaelite.co.kr/concierge/stock?goodsNo=...
//   단일: { goodsNo, totalStock, options:[{optionSno,label,color,size,stock,soldOut,addPrice}] }
//   다중: { goods:[ …위 객체… ] }
//
// HTML 스크래핑보다 가볍고, 고도몰 옵션 표시방식(일체형/분리형)과 무관하게 동작한다.

import { prisma } from "@/lib/db";

export interface StockOption {
  optionSno: number;
  label: string;
  color: string | null;
  size: string;
  stock: number;
  soldOut: boolean;
  addPrice: number;
}

export interface StockResult {
  goodsNo: string;
  totalStock: number;
  options: StockOption[];
}

const API_BASE = process.env.GODO_SALES_API_URL || "https://api.viaelite.co.kr/concierge/sales";
const API_KEY = process.env.GODO_SALES_API_KEY || "";

/** stock 엔드포인트 URL (sales URL에서 경로만 교체) */
function stockUrl(): string {
  return API_BASE.replace(/\/sales$/, "/stock");
}

/** 옵션 배열 → sizeStock 맵 (같은 사이즈가 색상별로 여러 개면 합산) */
export function toSizeStock(options: StockOption[]): { sizes: string[]; sizeStock: Record<string, number> } {
  const sizeStock: Record<string, number> = {};
  for (const o of options) {
    sizeStock[o.size] = (sizeStock[o.size] ?? 0) + Math.max(0, o.stock);
  }
  return { sizes: Object.keys(sizeStock), sizeStock };
}

/** 여러 상품의 재고를 한 번에 조회 (최대 100개/요청, 초과 시 분할) */
export async function fetchStock(goodsNos: string[]): Promise<Map<string, StockResult>> {
  const map = new Map<string, StockResult>();
  const uniq = Array.from(new Set(goodsNos.filter(Boolean)));
  if (uniq.length === 0) return map;

  for (let i = 0; i < uniq.length; i += 100) {
    const chunk = uniq.slice(i, i + 100);
    const url = new URL(stockUrl());
    url.searchParams.set("goodsNo", chunk.join(","));

    const res = await fetch(url.toString(), {
      headers: { "X-API-KEY": API_KEY },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`재고 API 오류 (${res.status})`);
    const data = await res.json();
    if (data?.error) throw new Error(`재고 API: ${data.error}`);

    const list: StockResult[] = Array.isArray(data?.goods)
      ? data.goods
      : data?.goodsNo
        ? [data as StockResult]
        : [];
    for (const g of list) map.set(String(g.goodsNo), g);
  }
  return map;
}

/** 단일 상품 재고 */
export async function fetchStockOne(goodsNo: string): Promise<StockResult | null> {
  const map = await fetchStock([goodsNo]);
  return map.get(goodsNo) ?? null;
}

export interface RefreshResult {
  targeted: number;
  updated: number;
  hidden: number;
  errors: number;
}

/**
 * 등록된 상품들의 사이즈·재고를 고도몰 API로 최신화한다.
 * goodsNos 미지정 시 전체 상품.
 * 완전 품절(총재고 0)이면 자동으로 노출을 끈다(active=false).
 */
export async function refreshStock(goodsNos?: string[]): Promise<RefreshResult> {
  const products = goodsNos
    ? await prisma.product.findMany({ where: { goodsNo: { in: goodsNos } }, select: { id: true, goodsNo: true, active: true } })
    : await prisma.product.findMany({ select: { id: true, goodsNo: true, active: true } });

  const result: RefreshResult = { targeted: products.length, updated: 0, hidden: 0, errors: 0 };
  if (products.length === 0) return result;

  const stockMap = await fetchStock(products.map((p) => p.goodsNo));

  for (const p of products) {
    const s = stockMap.get(p.goodsNo);
    if (!s) continue; // 옵션 없는 단품 등 — 건너뜀
    const { sizes, sizeStock } = toSizeStock(s.options);
    // 완전 품절이면 노출 끄기 (재입고 시 자동 노출은 하지 않음 — 어드민이 직접 켬)
    const hideNow = s.totalStock <= 0 && p.active;
    try {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          sizesJson: JSON.stringify(sizes),
          sizeStockJson: JSON.stringify(sizeStock),
          stock: s.totalStock,
          ...(hideNow ? { active: false } : {}),
        },
      });
      result.updated++;
      if (hideNow) result.hidden++;
    } catch {
      result.errors++;
    }
  }
  return result;
}
