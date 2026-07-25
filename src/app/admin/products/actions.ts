"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/godomall/scrape";
import { fetchStockOne, toSizeStock, refreshStock } from "@/lib/godomall/stock";

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

/** 어드민 상품 등록 — 고도몰 URL을 스크래핑해 상품을 생성/갱신 */
export async function importProduct(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { ok: false, message: "URL을 입력하세요." };

  try {
    const s = await scrapeProduct(url);

    // 사이즈·재고는 고도몰 API(es_goodsOption)를 우선 사용, 실패 시 HTML 파싱값 사용
    let sizes = s.sizes;
    let sizeStock = s.sizeStock;
    let stock = s.stock;
    try {
      const api = await fetchStockOne(s.goodsNo);
      if (api && api.options.length > 0) {
        const ss = toSizeStock(api.options);
        sizes = ss.sizes;
        sizeStock = ss.sizeStock;
        stock = api.totalStock;
      }
    } catch {
      // API 미설정/오류 시 HTML 파싱값 유지
    }

    const common = {
      name: s.name ?? undefined,
      brand: s.brand,
      category: s.category,
      listPrice: s.listPrice,
      salePrice: s.salePrice,
      stock,
      sizesJson: JSON.stringify(sizes),
      sizeStockJson: JSON.stringify(sizeStock),
      material: s.material,
      imagesJson: JSON.stringify(s.images),
      detailHtml: s.detailHtml,
      sourceUrl: s.sourceUrl,
    };

    await prisma.product.upsert({
      where: { goodsNo: s.goodsNo },
      update: common,
      create: { goodsNo: s.goodsNo, ...common, name: s.name ?? `상품 ${s.goodsNo}` },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: `등록 완료: ${s.name ?? s.goodsNo}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "등록 실패" };
  }
}

/** 등록된 상품 전체의 사이즈·재고를 고도몰 API로 최신화 */
export async function refreshAllStockAction() {
  try {
    const r = await refreshStock();
    revalidatePath("/admin/products");
    revalidatePath("/");
    return {
      ok: true,
      message: `대상 ${r.targeted}개 · 갱신 ${r.updated}개${r.errors ? ` · 실패 ${r.errors}개` : ""}`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "재고 갱신 실패" };
  }
}
