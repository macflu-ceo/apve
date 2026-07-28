"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { fetchCatalog, type CatalogFilters, type CatalogItem } from "@/lib/godomall/catalog";
import { importGoodsNos } from "@/lib/godomall/import";

export type BrowseItem = CatalogItem & { imported: boolean };

/** 고도몰 카탈로그 조회 + 이미 등록된 상품 표시 */
export async function browseCatalogAction(
  filters: CatalogFilters
): Promise<{ ok: boolean; message?: string; count?: number; items?: BrowseItem[] }> {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  try {
    const res = await fetchCatalog(filters);
    const goodsNos = res.list.map((i) => i.goodsNo);
    const existing = await prisma.product.findMany({
      where: { goodsNo: { in: goodsNos } },
      select: { goodsNo: true },
    });
    const importedSet = new Set(existing.map((e) => e.goodsNo));
    const items: BrowseItem[] = res.list.map((i) => ({ ...i, imported: importedSet.has(i.goodsNo) }));
    return { ok: true, count: res.count, items };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "카탈로그 조회 실패" };
  }
}

/** 선택한 goodsNo들을 돈버는명품샵에 등록/갱신 */
export async function importSelectedAction(
  goodsNos: string[]
): Promise<{ ok: boolean; message: string; created?: number; updated?: number; errors?: string[] }> {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  if (!goodsNos || goodsNos.length === 0) return { ok: false, message: "선택된 상품이 없습니다." };
  try {
    const r = await importGoodsNos(goodsNos);
    revalidatePath("/admin/products");
    revalidatePath("/");
    const parts = [`신규 ${r.created}개`, `갱신 ${r.updated}개`];
    if (r.errors.length > 0) parts.push(`실패 ${r.errors.length}개`);
    return { ok: true, message: `가져오기 완료 — ${parts.join(" · ")}`, created: r.created, updated: r.updated, errors: r.errors };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "가져오기 실패" };
  }
}
