// 상품 필터 — 소비자 화면(서버 쿼리)과 어드민 픽커가 공유하는 정의.
// 필터 항목: 검색어(상품명) · 카테고리 · 브랜드 · 시즌 · 정가 · 공급가 · 등록일 · 정렬
import { prisma } from "@/lib/db";
import { seasonRank } from "@/lib/season";

export type SortKey =
  | "recent"
  | "old"
  | "priceHigh"
  | "priceLow"
  | "listHigh"
  | "listLow"
  | "commHigh"
  | "commLow"
  | "seasonNew"
  | "discountHigh";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "최신 등록순" },
  { key: "old", label: "오래된순" },
  { key: "commHigh", label: "수수료 높은순" },
  { key: "commLow", label: "수수료 낮은순" },
  { key: "priceHigh", label: "공급가 높은순" },
  { key: "priceLow", label: "공급가 낮은순" },
  { key: "listHigh", label: "정가 높은순" },
  { key: "listLow", label: "정가 낮은순" },
  { key: "discountHigh", label: "할인율 높은순" },
  { key: "seasonNew", label: "최신 시즌순" },
];

export interface ProductFilter {
  q?: string;
  category?: string;
  brand?: string;
  season?: string;
  minList?: number;
  maxList?: number;
  minSale?: number;
  maxSale?: number;
  from?: string; // YYYY-MM-DD
  to?: string;
  sort?: SortKey;
}

/** URLSearchParams → ProductFilter */
export function parseFilter(sp: Record<string, string | undefined>): ProductFilter {
  const num = (v: string | undefined) => {
    if (!v) return undefined;
    const n = parseInt(v.replace(/[^\d]/g, ""), 10);
    return Number.isNaN(n) ? undefined : n;
  };
  return {
    q: sp.q?.trim() || undefined,
    category: sp.category || undefined,
    brand: sp.brand || undefined,
    season: sp.season || undefined,
    minList: num(sp.minList),
    maxList: num(sp.maxList),
    minSale: num(sp.minSale),
    maxSale: num(sp.maxSale),
    from: sp.from || undefined,
    to: sp.to || undefined,
    sort: (sp.sort as SortKey) || "recent",
  };
}

function kstStart(d: string) {
  return new Date(`${d}T00:00:00+09:00`);
}
function kstEnd(d: string) {
  return new Date(`${d}T23:59:59.999+09:00`);
}

/** ProductFilter → Prisma where (season/commission 정렬은 후처리) */
export function buildWhere(f: ProductFilter, opts: { activeOnly?: boolean } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.activeOnly) where.active = true;
  if (f.category) where.category = f.category;
  if (f.brand) where.brand = f.brand;
  if (f.season) where.season = f.season;

  if (f.minList != null || f.maxList != null) {
    where.listPrice = {
      ...(f.minList != null ? { gte: f.minList } : {}),
      ...(f.maxList != null ? { lte: f.maxList } : {}),
    };
  }
  if (f.minSale != null || f.maxSale != null) {
    where.salePrice = {
      ...(f.minSale != null ? { gte: f.minSale } : {}),
      ...(f.maxSale != null ? { lte: f.maxSale } : {}),
    };
  }
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: kstStart(f.from) } : {}),
      ...(f.to ? { lte: kstEnd(f.to) } : {}),
    };
  }
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { brand: { contains: f.q, mode: "insensitive" } },
    ];
  }
  return where;
}

type SortableProduct = {
  createdAt: Date;
  salePrice: number | null;
  listPrice: number | null;
  season: string | null;
};

/** 정렬 비교자 (수수료·시즌·할인율 등 파생값 포함) */
export function sortProducts<T extends SortableProduct>(list: T[], sort: SortKey = "recent"): T[] {
  const sale = (p: SortableProduct) => p.salePrice ?? -1;
  const list0 = (p: SortableProduct) => p.listPrice ?? -1;
  const disc = (p: SortableProduct) =>
    p.listPrice && p.salePrice && p.listPrice > 0 ? 1 - p.salePrice / p.listPrice : -1;
  const arr = [...list];
  switch (sort) {
    case "old":
      arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      break;
    case "priceHigh":
    case "commHigh": // 수수료 = 공급가 × 등급% → 공급가 순서와 동일
      arr.sort((a, b) => sale(b) - sale(a));
      break;
    case "priceLow":
    case "commLow":
      arr.sort((a, b) => sale(a) - sale(b));
      break;
    case "listHigh":
      arr.sort((a, b) => list0(b) - list0(a));
      break;
    case "listLow":
      arr.sort((a, b) => list0(a) - list0(b));
      break;
    case "discountHigh":
      arr.sort((a, b) => disc(b) - disc(a));
      break;
    case "seasonNew":
      arr.sort((a, b) => seasonRank(b.season) - seasonRank(a.season));
      break;
    case "recent":
    default:
      arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return arr;
}

/** 필터 선택지(브랜드/카테고리/시즌) — 활성 상품 기준 */
export async function getFacets(activeOnly = true) {
  const where = activeOnly ? { active: true } : {};
  const rows = await prisma.product.findMany({
    where,
    select: { brand: true, category: true, season: true },
  });
  const brands = new Set<string>();
  const categories = new Set<string>();
  const seasons = new Set<string>();
  for (const r of rows) {
    if (r.brand) brands.add(r.brand);
    if (r.category) categories.add(r.category);
    if (r.season) seasons.add(r.season);
  }
  return {
    brands: [...brands].sort(),
    categories: [...categories].sort(),
    seasons: [...seasons].sort((a, b) => seasonRank(b) - seasonRank(a)),
  };
}
