"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { parseSeason } from "@/lib/season";
import { refreshStock } from "@/lib/godomall/stock";
import { upsertFromUrl, importFromLinksText, toGoodsUrl } from "@/lib/godomall/import";
import { fetchDomesticGoodsNos, refreshPrices } from "@/lib/godomall/catalog";

/** 상품 노출/원산지/태그 수정 (수수료율은 회원 등급에 귀속) */
export async function updateProduct(
  id: string,
  data: { active?: boolean; origin?: string | null; tags?: string[] }
) {
  if (!isAdmin()) return;
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
  if (!isAdmin()) return;
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
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
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
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
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
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
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

/** 등록된 상품 전체 최신화 — 재고·사이즈 + 가격(정가·판매가, 부티크 연동 변동 반영) + 시즌 보정 */
export async function refreshAllStockAction() {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  try {
    await backfillSeasons();
    const [r, pr] = await Promise.all([refreshStock(), refreshPrices()]);
    revalidatePath("/admin/products");
    revalidatePath("/");
    const parts = [`대상 ${r.targeted}개`, `재고갱신 ${r.updated}개`, `가격변동 반영 ${pr.priced}개`];
    if (r.hidden > 0) parts.push(`품절 자동숨김 ${r.hidden}개`);
    if (r.errors + pr.errors > 0) parts.push(`실패 ${r.errors + pr.errors}개`);
    return { ok: true, message: parts.join(" · ") };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "최신화 실패" };
  }
}

/**
 * 국내배송 동기화 — 고도몰 검색태그(naverTag "국내배송")를 상품 태그에 반영.
 * 국내배송 상품엔 "국내배송" 태그 추가, 아닌 상품엔 제거. (상품 상세페이지 배송표시에 사용)
 */
export async function syncDomesticTags() {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  try {
    const domestic = await fetchDomesticGoodsNos();
    const products = await prisma.product.findMany({ select: { id: true, goodsNo: true, tagsJson: true } });
    let added = 0;
    let removed = 0;
    for (const p of products) {
      let tags: string[] = [];
      try {
        const parsed = JSON.parse(p.tagsJson ?? "[]");
        if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
      } catch {
        tags = [];
      }
      const has = tags.includes("국내배송");
      const shouldHave = domestic.has(p.goodsNo);
      if (has === shouldHave) continue;
      const next = shouldHave ? [...tags, "국내배송"] : tags.filter((t) => t !== "국내배송");
      await prisma.product.update({ where: { id: p.id }, data: { tagsJson: JSON.stringify(next) } });
      shouldHave ? added++ : removed++;
    }
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: `국내배송 동기화 — 추가 ${added} · 해제 ${removed} (고도몰 국내배송 ${domestic.size}개)` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "국내배송 동기화 실패" };
  }
}
