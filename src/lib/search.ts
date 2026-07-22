import { prisma } from "@/lib/db";

/** 명품 커머스 표준 카테고리 (어드민에서 수정/추가 가능) */
export const DEFAULT_SEARCH_CATEGORIES = [
  "가방", "지갑", "신발", "의류", "아우터", "니트", "셔츠", "팬츠",
  "원피스", "스커트", "액세서리", "주얼리", "시계", "벨트", "모자", "스카프",
];

export async function ensureDefaultSearchCategories() {
  const count = await prisma.searchCategory.count();
  if (count > 0) return;
  await prisma.searchCategory.createMany({
    data: DEFAULT_SEARCH_CATEGORIES.map((name, i) => ({ name, sort: i })),
  });
}

export async function listSearchCategories() {
  await ensureDefaultSearchCategories();
  return prisma.searchCategory.findMany({
    where: { active: true },
    orderBy: [{ sort: "asc" }, { name: "asc" }],
  });
}

/** 등록된 상품에서 브랜드 목록 취합 */
export async function listBrands(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
  });
  return rows.map((r) => r.brand!).filter(Boolean).sort();
}

/**
 * "구", "구찌", "구찌 가" 처럼 입력하면 브랜드 / 브랜드+카테고리 추천을 만든다.
 */
export function buildSuggestions(q: string, brands: string[], categories: string[], limit = 10): string[] {
  const query = q.trim().replace(/\s+/g, " ");
  if (!query) return [];
  const lower = query.toLowerCase();
  const out: string[] = [];

  // 입력을 "브랜드부분 + 카테고리부분"으로 분해 시도
  const matchedBrands = brands.filter((b) => b.toLowerCase().includes(lower.split(" ")[0]));

  // 1) 브랜드 자체
  for (const b of brands) {
    if (b.toLowerCase().includes(lower) && !out.includes(b)) out.push(b);
    if (out.length >= limit) return out;
  }

  // 2) 브랜드 + 카테고리 조합
  const parts = query.split(" ");
  const brandPart = parts[0].toLowerCase();
  const catPart = parts.slice(1).join(" ").toLowerCase();
  const cands = matchedBrands.length ? matchedBrands : brands.filter((b) => b.toLowerCase().includes(brandPart));

  for (const b of cands) {
    for (const c of categories) {
      if (catPart && !c.toLowerCase().includes(catPart)) continue;
      const s = `${b} ${c}`;
      if (!out.includes(s)) out.push(s);
      if (out.length >= limit) return out;
    }
  }

  // 3) 카테고리만 매칭
  for (const c of categories) {
    if (c.toLowerCase().includes(lower) && !out.includes(c)) out.push(c);
    if (out.length >= limit) return out;
  }

  return out.slice(0, limit);
}

/** 검색어 로그 저장 (통계용) */
export async function logSearch(keyword: string) {
  const k = keyword.trim();
  if (!k) return;
  try {
    await prisma.searchLog.create({ data: { keyword: k } });
  } catch {
    /* 통계 실패는 무시 */
  }
}
