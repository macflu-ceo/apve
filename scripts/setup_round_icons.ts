// 메인 원형 아이콘 3개 = 기획전 3개 생성 후 연결
//   ① 할인율 높은 상품  ② 구찌 신상 모음전  ③ 프라다 신상 모음전
//
//   미리보기:  npx tsx scripts/setup_round_icons.ts
//   실행:      npx tsx scripts/setup_round_icons.ts --commit
//
// 동작: 구찌/프라다 신상은 viaelite 카탈로그(sort=new)에서 goodsNo를 뽑아 DB로 import,
//       할인율 높은 상품은 DB의 기존 상품에서 (정가-판매가)/정가 상위로 선정.
//       → 기획전 3개 upsert(제목 기준) → 상품 배치 → 원형 아이콘(Category) 3개 연결.
import "./loadenv";
import "./catalogenv"; // ← catalog.ts import 전에 GODO_SALES_* 세팅
import { fetchCatalog } from "../src/lib/godomall/catalog";
import { importGoodsNos } from "../src/lib/godomall/import";
import { prisma } from "../src/lib/db";

const commit = process.argv.includes("--commit");
const GUCCI_N = 24;
const PRADA_N = 24;
const DISCOUNT_N = 30;
const PREMIUM_N = 30; // 고마진=비싼 하이엔드 (가격 높은 순)

function firstImage(imagesJson: string | null): string | null {
  if (!imagesJson) return null;
  try { const a = JSON.parse(imagesJson); return Array.isArray(a) && a[0] ? String(a[0]) : null; } catch { return null; }
}

async function brandNewGoodsNos(brand: string, n: number): Promise<string[]> {
  const r = await fetchCatalog({ brand, sort: "new", inStock: true, limit: n });
  return r.list.map((x) => String(x.goodsNo)).slice(0, n);
}

async function upsertExhibition(title: string, subtitle: string, sort: number) {
  const existing = await prisma.exhibition.findFirst({ where: { title } });
  if (existing) {
    await prisma.exhibition.update({ where: { id: existing.id }, data: { subtitle, sort, active: true } });
    return existing.id;
  }
  const created = await prisma.exhibition.create({ data: { title, subtitle, sort, active: true } });
  return created.id;
}

async function setExhibitionProducts(exhibitionId: string, goodsNos: string[]) {
  const products = await prisma.product.findMany({ where: { goodsNo: { in: goodsNos } }, select: { id: true, goodsNo: true } });
  const idByGoods = new Map(products.map((p) => [p.goodsNo, p.id]));
  const ordered = goodsNos.map((g) => idByGoods.get(g)).filter((v): v is string => !!v);
  await prisma.$transaction([
    prisma.exhibitionProduct.deleteMany({ where: { exhibitionId } }),
    ...ordered.map((productId, i) => prisma.exhibitionProduct.create({ data: { exhibitionId, productId, sort: i } })),
  ]);
  return ordered.length;
}

async function upsertIcon(label: string, linkUrl: string, imageUrl: string | null, sort: number) {
  const existing = await prisma.category.findFirst({ where: { label } });
  const data = { linkUrl, imageUrl, sort, active: true, emoji: null as string | null };
  if (existing) { await prisma.category.update({ where: { id: existing.id }, data }); return "갱신"; }
  await prisma.category.create({ data: { label, ...data } });
  return "생성";
}

async function main() {
  console.log(`키: ${process.env.GODO_SALES_API_KEY ? "OK" : "없음(구찌/프라다 import 불가)"}  / commit=${commit}`);

  // ── 1) 구찌·프라다 신상 + 프리미엄(비싼순) goodsNo 수집 ──
  console.log("\n① 구찌·프라다 신상 + 프리미엄 goodsNo 수집…");
  const [gucci, prada, premiumRes] = await Promise.all([
    brandNewGoodsNos("Gucci", GUCCI_N),
    brandNewGoodsNos("Prada", PRADA_N),
    fetchCatalog({ sort: "priceHigh", inStock: true, limit: PREMIUM_N }),
  ]);
  const premium = premiumRes.list.map((x) => String(x.goodsNo)).slice(0, PREMIUM_N);
  console.log(`   구찌 ${gucci.length} · 프라다 ${prada.length} · 프리미엄 ${premium.length}`);

  if (!commit) {
    console.log("\n※ 미리보기입니다. --commit 을 붙이면 실제로 import/기획전/아이콘을 생성합니다.");
    // 할인 후보 미리보기
    const ps = await prisma.product.findMany({ where: { active: true }, select: { goodsNo: true, name: true, listPrice: true, salePrice: true, stock: true } });
    const disc = ps.filter((p) => p.stock > 0 && p.listPrice > 0 && p.salePrice < p.listPrice)
      .map((p) => ({ ...p, rate: Math.round((1 - p.salePrice / p.listPrice) * 100) }))
      .sort((a, b) => b.rate - a.rate).slice(0, DISCOUNT_N);
    console.log(`   할인 후보 상위 ${disc.length}개 (예: ${disc.slice(0, 3).map((p) => p.rate + "% " + p.name?.slice(0, 18)).join(" / ")})`);
    console.log(`   프리미엄(비싼순) 상위 예: ${premiumRes.list.slice(0, 3).map((p) => Math.round(p.sellPrice / 10000) + "만 " + p.goodsNm?.slice(0, 18)).join(" / ")}`);
    return;
  }

  // ── 2) 신상 import (DB 반영) ──
  console.log("\n② 신상·프리미엄 import(스크래핑)…");
  const r = await importGoodsNos([...new Set([...gucci, ...prada, ...premium])]);
  console.log(`   신규 ${r.created} · 갱신 ${r.updated} · 실패 ${r.errors.length}`);

  // ── 3) 할인율 높은 상품 선정(DB) ──
  const ps = await prisma.product.findMany({ where: { active: true }, select: { goodsNo: true, name: true, listPrice: true, salePrice: true, stock: true, imagesJson: true } });
  const disc = ps.filter((p) => p.stock > 0 && p.listPrice > 0 && p.salePrice < p.listPrice)
    .map((p) => ({ ...p, rate: Math.round((1 - p.salePrice / p.listPrice) * 100) }))
    .sort((a, b) => b.rate - a.rate).slice(0, DISCOUNT_N);
  const discountGoods = disc.map((p) => p.goodsNo);
  console.log(`\n③ 할인율 높은 상품 ${discountGoods.length}개 (최고 ${disc[0]?.rate}%)`);

  // 아이콘 이미지용 대표 상품 이미지
  const pick = async (goodsNo?: string) => {
    if (!goodsNo) return null;
    const p = await prisma.product.findUnique({ where: { goodsNo }, select: { imagesJson: true } });
    return firstImage(p?.imagesJson ?? null);
  };

  // ── 4) 기획전 3개 upsert + 상품 배치 ──
  console.log("\n④ 기획전 생성/갱신 + 상품 배치…");
  const exDiscount = await upsertExhibition("할인율 높은 상품", "지금 가장 많이 내린 특가 셀렉션", 1);
  const exGucci = await upsertExhibition("구찌 신상 모음전", "GUCCI 새로 들어온 신상 셀렉션", 2);
  const exPrada = await upsertExhibition("프라다 신상 모음전", "PRADA 새로 들어온 신상 셀렉션", 3);
  const exPremium = await upsertExhibition("프리미엄 하이엔드", "가장 프리미엄한 최상위 하이엔드 셀렉션", 4);
  const nD = await setExhibitionProducts(exDiscount, discountGoods);
  const nG = await setExhibitionProducts(exGucci, gucci);
  const nP = await setExhibitionProducts(exPrada, prada);
  const nPr = await setExhibitionProducts(exPremium, premium);
  console.log(`   할인율 높은 상품: ${nD}개 / 구찌: ${nG}개 / 프라다: ${nP}개 / 프리미엄: ${nPr}개`);

  // ── 5) 원형 아이콘 4개 연결 ──
  console.log("\n⑤ 원형 아이콘(Category) 연결…");
  console.log("  " + await upsertIcon("할인 특가", `/exhibition/${exDiscount}`, await pick(discountGoods[0]), 2) + ": 할인 특가");
  console.log("  " + await upsertIcon("구찌 신상", `/exhibition/${exGucci}`, await pick(gucci[0]), 3) + ": 구찌 신상");
  console.log("  " + await upsertIcon("프라다 신상", `/exhibition/${exPrada}`, await pick(prada[0]), 4) + ": 프라다 신상");
  console.log("  " + await upsertIcon("프리미엄", `/exhibition/${exPremium}`, await pick(premium[0]), 5) + ": 프리미엄");

  console.log("\n✅ 완료. 홈 배너 아래 원형 아이콘을 확인하세요.");
}

main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
