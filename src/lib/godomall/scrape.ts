// 고도몰 상품 스크래핑 어댑터
// 상품 URL(goods_view.php?goodsNo=...) 페이지를 받아 상품 정보를 추출한다.
// 고도몰 프로의 실제 마크업 기준:
//  - 이름/이미지: og:title / og:image 메타태그
//  - 정가/판매가/재고: hidden input (set_goods_fixedPrice / set_goods_price / set_goods_stock)
//  - 카테고리: <title> "... | 카테고리 - 몰이름"
//  - 사이즈별 재고: <select name="optionSnoInput"> 안에 서버 렌더링되어 있음 (일체형 옵션 표시)
//      value="30993675||0||||1^|^Sand-XXXL"  →  옵션번호||추가금||…||재고 ^|^ 옵션명
//      실제 상품 6건으로 검증: 옵션 재고 합계 == set_goods_stock 값과 항상 일치

import { extractGoodsNo, productUrl } from "./link";

/** 상품의 옵션 1건 (색상-사이즈 조합) */
export interface ScrapedOption {
  /** 고도몰 옵션번호 (optionSno) */
  optionSno: string;
  /** 옵션 전체 이름 예: "BLACK-L" */
  label: string;
  /** 색상 예: "BLACK" (구분자가 없으면 null) */
  color: string | null;
  /** 사이즈 예: "L" */
  size: string;
  /** 옵션 재고 수량 */
  stock: number;
  /** 옵션 추가금(원) */
  addPrice: number;
}

export interface ScrapedProduct {
  goodsNo: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  listPrice: number | null;
  salePrice: number | null;
  stock: number | null;
  sizes: string[];
  /** 사이즈 → 재고 수량 */
  sizeStock: Record<string, number>;
  /** 옵션 원본 (색상·옵션번호·추가금 포함) */
  options: ScrapedOption[];
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

/**
 * 옵션 select 를 파싱해 사이즈별 재고를 뽑는다.
 * 옵션이 없는 단품이면 빈 배열.
 */
export function parseOptions(html: string): ScrapedOption[] {
  const select = html.match(/<select[^>]*name=["']optionSnoInput["'][^>]*>([\s\S]*?)<\/select>/i)?.[1];
  if (!select) return [];

  const out: ScrapedOption[] = [];
  for (const m of select.matchAll(/<option[^>]*\svalue=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi)) {
    const value = m[1];
    if (!value) continue; // 첫 안내용 <option value="">

    const [left, labelRaw] = value.split("^|^");
    const label = decode(labelRaw ?? "");
    if (!label) continue;

    const parts = left.split("||");
    const optionSno = parts[0] ?? "";
    const addPrice = toInt(parts[1]) ?? 0;
    // 마지막 칸이 재고. 표시 텍스트에 [품절]이 있으면 0으로 확정.
    const soldOut = /품절/.test(m[2]);
    const stock = soldOut ? 0 : toInt(parts[parts.length - 1]) ?? 0;

    // "BLACK-L" → 색상 BLACK / 사이즈 L (사이즈는 마지막 하이픈 뒤)
    const cut = label.lastIndexOf("-");
    const color = cut > 0 ? label.slice(0, cut) : null;
    const size = cut > 0 ? label.slice(cut + 1) : label;

    out.push({ optionSno, label, color, size, stock, addPrice });
  }
  return out;
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

  // 카테고리: 상품 브레드크럼(.location_tit)에서 전체 경로 추출 (남성/여성 구분 포함)
  //   예: <div class="location_tit"><a href="#"><span>남성</span></a></div> → "남성 > 의류 > 셔츠"
  const crumbs: string[] = [];
  for (const m of html.matchAll(/class=["']location_tit["']\s*>\s*<a[^>]*>\s*<span>\s*([^<]*?)\s*<\/span>/gi)) {
    const t = decode(m[1]);
    if (t && !/^(home|홈)$/i.test(t)) crumbs.push(t);
  }
  // 브레드크럼 없으면 <title> "이름 | 카테고리 - 몰" 폴백
  const titleTag = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const category =
    crumbs.length > 0
      ? crumbs.join(" > ")
      : titleTag.includes("|")
        ? decode(titleTag.split("|")[1]?.split("-")[0] ?? "") || null
        : null;

  // 가격 / 재고 (hidden input)
  const listPrice = toInt(inputVal(html, "set_goods_fixedPrice"));
  const salePrice = toInt(inputVal(html, "set_goods_price"));

  // 옵션(사이즈별 재고). 같은 사이즈가 색상별로 여러 개면 합산한다.
  const options = parseOptions(html);
  const sizeStock: Record<string, number> = {};
  for (const o of options) sizeStock[o.size] = (sizeStock[o.size] ?? 0) + o.stock;
  const sizes = Object.keys(sizeStock);

  // 총재고는 hidden input 우선, 없으면 옵션 합계로 보정
  const stock =
    toInt(inputVal(html, "set_goods_stock")) ??
    (options.length > 0 ? options.reduce((s, o) => s + o.stock, 0) : null);

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
    sizes,
    sizeStock,
    options,
    material: null,
    images,
    detailHtml: null,
    sourceUrl,
  };
}
