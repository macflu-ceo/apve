"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseSeason } from "@/lib/season";
import { refreshStock } from "@/lib/godomall/stock";
import { upsertFromUrl, importFromLinksText, toGoodsUrl } from "@/lib/godomall/import";

/** 상품 노출/원산지/태그 수정 (수수료율은 회원 등급에 귀속) */
export async function updateProduct(
  id: string,
  data: { active?: boolean; origin?: string | null; tags?: string[] }
) {
  const { tags, ...rest } = data;
  await prisma.product.update({
    where: { id },
    data: { ...rest, ...(tags ? { tagsJson: JSON.stringify(tags) } : {}) },
  });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

/** 상품 삭제 (연결된 링크/판매/착용샷도 정리) */
export async function deleteProduct(id: string) {
  await prisma.$transaction([
    prisma.issuedLink.deleteMany({ where: { productId: id } }),
    prisma.tryOnImage.deleteMany({ where: { productId: id } }),
    prisma.sale.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

/** 상품 여러 개 일괄 삭제 (체크 선택) */
export async function deleteProducts(ids: string[]) {
  const list = (ids ?? []).filter(Boolean);
  if (list.length === 0) return { ok: false, message: "선택된 상품이 없습니다." };
  await prisma.$transaction([
    prisma.issuedLink.deleteMany({ where: { productId: { in: list } } }),
    prisma.tryOnImage.deleteMany({ where: { productId: { in: list } } }),
    prisma.sale.deleteMany({ where: { productId: { in: list } } }),
    prisma.product.deleteMany({ where: { id: { in: list } } }),
  ]);
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, count: list.length };
}

/** 어드민 상품 등록 — 고도몰 상품번호(goodsNo) 또는 URL로 상품을 생성/갱신 */
export async function importProduct(formData: FormData) {
  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) return { ok: false, message: "상품번호 또는 URL을 입력하세요." };

  const url = toGoodsUrl(raw);
  if (!url) return { ok: false, message: "상품번호(숫자) 또는 goodsNo가 포함된 링크를 넣으세요." };

  try {
    const r = await upsertFromUrl(url);
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: `등록 완료: ${r.name}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "등록 실패" };
  }
}

/**
 * 링크 여러 개를 붙여넣어 일괄 등록/갱신한다.
 * 줄바꿈·공백·콤마로 구분된 텍스트에서 goodsNo가 있는 URL만 추출한다.
 */
export async function importFromLinks(text: string) {
  const r = await importFromLinksText(text);
  if (!r.ok) return { ok: false, message: r.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, total: r.total, created: r.created, updated: r.updated, errors: r.errors };
}

/** 상품명에서 시즌(SS26 등)을 채운다. (기존 상품 일괄 보정) */
async function backfillSeasons() {
  const rows = await prisma.product.findMany({
    where: { season: null },
    select: { id: true, name: true },
  });
  for (const p of rows) {
    const season = parseSeason(p.name);
    if (season) await prisma.product.update({ where: { id: p.id }, data: { season } });
  }
}

/** 등록된 상품 전체의 사이즈·재고를 고도몰 API로 최신화 (+ 시즌 보정) */
export async function refreshAllStockAction() {
  try {
    await backfillSeasons();
    const r = await refreshStock();
    revalidatePath("/admin/products");
    revalidatePath("/");
    const parts = [`대상 ${r.targeted}개`, `갱신 ${r.updated}개`];
    if (r.hidden > 0) parts.push(`품절 자동숨김 ${r.hidden}개`);
    if (r.errors > 0) parts.push(`실패 ${r.errors}개`);
    return { ok: true, message: parts.join(" · ") };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "재고 갱신 실패" };
  }
}
