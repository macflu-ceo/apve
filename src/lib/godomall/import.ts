// 상품 등록 공용 헬퍼
// 고도몰 상품(URL 또는 goodsNo)을 스크래핑 + 재고 API로 조회해 Product 로 upsert 한다.
// - 링크 붙여넣기 등록(products/actions)과 카탈로그 픽 등록(catalog/actions)이 공용으로 쓴다.

import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/godomall/scrape";
import { fetchStockOne, toSizeStock } from "@/lib/godomall/stock";
import { extractGoodsNo } from "@/lib/godomall/link";
import { parseSeason } from "@/lib/season";
import { conciergePrice } from "@/lib/pricing";

/** goodsNo → 고도몰 상품 상세 URL */
export function goodsViewUrl(goodsNo: string): string {
  return `https://viaelite.co.kr/goods/goods_view.php?goodsNo=${goodsNo}`;
}

/**
 * 입력을 고도몰 상품 URL로 정규화한다.
 * - 순수 숫자(상품번호) → goods_view URL
 * - goodsNo가 포함된 URL → 그 번호로 재구성
 * - 그 외 → null
 */
export function toGoodsUrl(input: string): string | null {
  const t = String(input || "").trim();
  if (t === "") return null;
  if (/^\d{3,20}$/.test(t)) return goodsViewUrl(t); // 상품번호만 입력
  const g = extractGoodsNo(t); // URL에서 goodsNo 추출
  return g ? goodsViewUrl(g) : null;
}

/**
 * URL 하나를 스크래핑 + 재고 API로 등록/갱신한다. (공통 헬퍼)
 * @returns 등록된 상품 정보
 */
export async function upsertFromUrl(url: string): Promise<{ goodsNo: string; name: string; created: boolean }> {
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
    season: parseSeason(s.name),
    listPrice: s.listPrice,
    salePrice: conciergePrice(s.salePrice), // 원본가에서 5% 낮춰 등록

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

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  errors: string[];
}

/** 여러 goodsNo(또는 URL 텍스트)를 일괄 등록/갱신한다. 서버 부하를 줄여 3개씩 순차 처리. */
export async function importGoodsNos(goodsNos: string[]): Promise<ImportResult> {
  const uniq = Array.from(new Set(goodsNos.map((g) => String(g).trim()).filter(Boolean)));
  const result: ImportResult = { total: uniq.length, created: 0, updated: 0, errors: [] };
  if (uniq.length === 0) return result;

  const CHUNK = 3;
  for (let i = 0; i < uniq.length; i += CHUNK) {
    const batch = uniq.slice(i, i + CHUNK);
    const results = await Promise.allSettled(batch.map((g) => upsertFromUrl(goodsViewUrl(g))));
    results.forEach((res, j) => {
      if (res.status === "fulfilled") {
        res.value.created ? result.created++ : result.updated++;
      } else {
        result.errors.push(`${batch[j]}: ${res.reason instanceof Error ? res.reason.message : "실패"}`);
      }
    });
  }
  return result;
}

/** 링크/상품번호 텍스트(줄바꿈/공백/콤마 구분)에서 goodsNo를 추출해 일괄 등록 */
export async function importFromLinksText(text: string): Promise<ImportResult & { ok: boolean; message?: string }> {
  const tokens = String(text || "")
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const goodsNos: string[] = [];
  for (const t of tokens) {
    let g: string | null = null;
    if (/^\d{3,20}$/.test(t)) g = t; // 상품번호만
    else if (/goodsNo=/i.test(t) || /goods_view\.php/i.test(t)) g = extractGoodsNo(t); // URL
    if (!g || seen.has(g)) continue;
    seen.add(g);
    goodsNos.push(g);
  }

  if (goodsNos.length === 0) {
    return { ok: false, total: 0, created: 0, updated: 0, errors: [], message: "유효한 상품번호/링크를 찾지 못했습니다. (상품번호 또는 goodsNo가 포함된 링크를 넣으세요)" };
  }
  const r = await importGoodsNos(goodsNos);
  return { ok: true, ...r };
}
