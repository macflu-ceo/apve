"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/godomall/scrape";
import { fetchStockOne, toSizeStock, refreshStock } from "@/lib/godomall/stock";
import { extractGoodsNo } from "@/lib/godomall/link";

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

/**
 * URL 하나를 스크래핑 + 재고 API로 등록/갱신한다. (공통 헬퍼)
 * @returns 등록된 상품명
 */
async function upsertFromUrl(url: string): Promise<{ goodsNo: string; name: string; created: boolean }> {
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

  const existing = await prisma.product.findUnique({ where: { goodsNo: s.goodsNo }, select: { id: true } });
  await prisma.product.upsert({
    where: { goodsNo: s.goodsNo },
    update: common,
    create: { goodsNo: s.goodsNo, ...common, name: s.name ?? `상품 ${s.goodsNo}` },
  });
  return { goodsNo: s.goodsNo, name: s.name ?? `상품 ${s.goodsNo}`, created: !existing };
}

/** 어드민 상품 등록 — 고도몰 URL을 스크래핑해 상품을 생성/갱신 */
export async function importProduct(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { ok: false, message: "URL을 입력하세요." };

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
  // URL 후보 추출 (엑셀 열 복사 = 줄바꿈, 그 외 공백/콤마도 허용)
  const tokens = String(text || "")
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => /goodsNo=/i.test(t) || /goods_view\.php/i.test(t));

  // goodsNo 기준 중복 제거 (첫 URL 유지)
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const t of tokens) {
    const g = extractGoodsNo(t);
    if (!g || seen.has(g)) continue;
    seen.add(g);
    urls.push(t);
  }

  if (urls.length === 0) {
    return { ok: false, message: "유효한 상품 링크를 찾지 못했습니다. (goodsNo가 포함된 링크를 붙여넣으세요)" };
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  // 서버 부하를 줄이려 3개씩 순차 처리
  const CHUNK = 3;
  for (let i = 0; i < urls.length; i += CHUNK) {
    const batch = urls.slice(i, i + CHUNK);
    const results = await Promise.allSettled(batch.map((u) => upsertFromUrl(u)));
    results.forEach((res, j) => {
      if (res.status === "fulfilled") {
        res.value.created ? created++ : updated++;
      } else {
        const g = extractGoodsNo(batch[j]) ?? batch[j];
        errors.push(`${g}: ${res.reason instanceof Error ? res.reason.message : "실패"}`);
      }
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, total: urls.length, created, updated, errors };
}

/** 등록된 상품 전체의 사이즈·재고를 고도몰 API로 최신화 */
export async function refreshAllStockAction() {
  try {
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
