// 고도몰 상품 스크래핑 어댑터
// 상품 URL(goods_view.php?goodsNo=...) 페이지를 받아 상품 정보를 추출한다.
// 고도몰 프로의 실제 마크업 기준:
//  - 이름/이미지: og:title / og:image 메타태그
//  - 정가/판매가/재고: hidden input (set_goods_fixedPrice / set_goods_price / set_goods_stock)
//  - 카테고리: <title> "... | 카테고리 - 몰이름"
//  - 사이즈 옵션: AJAX 로딩이라 정적 HTML엔 없음 → 비움(추후 옵션 API 연동 시 채움)

import { extractGoodsNo, productUrl } from "./link";

export interface ScrapedProduct {
  goodsNo: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  listPrice: number | null;
  salePrice: number | null;
  stock: number | null;
  sizes: string[];
  material: string | null;
  images: string[];
  detailHtml: string | null;
  sourceUrl: string;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** 메타태그(property/name) content 추출 */
function meta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
  const m =
    html.match(re) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
  return m ? decode(m[1]) : null;
}

/** hidden input 등의 value 추출 (속성 순서 무관) */
function inputVal(html: string, name: string): string | null {
  const re = new RegExp(`name=["']${name}["'][^>]*\\svalue=["']([^"']*)["']`, "i");
  const m =
    html.match(re) ||
    html.match(new RegExp(`value=["']([^"']*)["'][^>]*\\sname=["']${name}["']`, "i"));
  return m ? m[1] : null;
}

/** "706000.00" / "429,900" → 706000 / 429900 */
function toInt(s: string | null): number | null {
  if (s == null || s === "") return null;
  const n = Math.round(parseFloat(s.replace(/,/g, "")));
  return Number.isNaN(n) ? null : n;
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const goodsNo = extractGoodsNo(url);
  if (!goodsNo) throw new Error("URL에서 goodsNo를 찾을 수 없습니다: " + url);

  const sourceUrl = productUrl(goodsNo);
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DonbeonBot/0.1)" },
    next: { revalidate: 60 * 30 },
  });
  if (!res.ok) throw new Error(`상품 페이지 요청 실패 (${res.status})`);
  const html = await res.text();

  // 이름 / 브랜드 / 카테고리
  const name = meta(html, "og:title") || decode(html.match(/<title>([^<|]*)/i)?.[1] ?? "") || null;
  const brand = name?.match(/^\s*\[([^\]]+)\]/)?.[1]?.trim() ?? null;
  // <title> "이름 | 카테고리 - 몰" 에서 카테고리 추출
  const titleTag = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const category = titleTag.includes("|") ? decode(titleTag.split("|")[1]?.split("-")[0] ?? "") || null : null;

  // 가격 / 재고 (hidden input)
  const listPrice = toInt(inputVal(html, "set_goods_fixedPrice"));
  const salePrice = toInt(inputVal(html, "set_goods_price"));
  const stock = toInt(inputVal(html, "set_goods_stock"));

  // 이미지 (og:image + 제이프리모 S3 패턴 수집, 순서 유지 dedup)
  const images: string[] = [];
  const push = (u: string) => { if (u && !images.includes(u)) images.push(u); };
  const og = meta(html, "og:image");
  if (og) push(og);
  for (const m of html.matchAll(/https?:\/\/[^"'\\]*jprimo-partners-system-bucket[^"'\\]*\.(?:jpg|jpeg|png|webp)/gi)) {
    push(m[0]);
  }

  return {
    goodsNo,
    name,
    brand,
    category,
    listPrice,
    salePrice,
    stock,
    sizes: [], // 옵션은 AJAX 로딩 → 추후 옵션 API 연동 시 채움
    material: null,
    images,
    detailHtml: null,
    sourceUrl,
  };
}
