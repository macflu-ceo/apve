"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/godomall/scrape";

/** 상품 수수료율/노출 수정 */
export async function updateProduct(id: string, data: { commissionRate?: number; active?: boolean }) {
  await prisma.product.update({ where: { id }, data });
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
  const commissionRate = Number(formData.get("commissionRate") ?? 10);
  if (!url) return { ok: false, message: "URL을 입력하세요." };

  try {
    const s = await scrapeProduct(url);
    await prisma.product.upsert({
      where: { goodsNo: s.goodsNo },
      update: {
        name: s.name ?? undefined,
        brand: s.brand,
        category: s.category,
        listPrice: s.listPrice,
        salePrice: s.salePrice,
        stock: s.stock,
        sizesJson: JSON.stringify(s.sizes),
        material: s.material,
        imagesJson: JSON.stringify(s.images),
        detailHtml: s.detailHtml,
        sourceUrl: s.sourceUrl,
        commissionRate,
      },
      create: {
        goodsNo: s.goodsNo,
        name: s.name ?? `상품 ${s.goodsNo}`,
        brand: s.brand,
        category: s.category,
        listPrice: s.listPrice,
        salePrice: s.salePrice,
        stock: s.stock,
        sizesJson: JSON.stringify(s.sizes),
        material: s.material,
        imagesJson: JSON.stringify(s.images),
        detailHtml: s.detailHtml,
        sourceUrl: s.sourceUrl,
        commissionRate,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true, message: `등록 완료: ${s.name ?? s.goodsNo}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "등록 실패" };
  }
}
