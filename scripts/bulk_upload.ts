// 돈버는명품샵 — 상품 일괄 업로드 + 홈 섹션/기획전 생성 스크립트
//
// 사용법:
//   미리보기(안전):   npx tsx scripts/bulk_upload.ts
//   실제 실행:        npx tsx scripts/bulk_upload.ts --commit
//
// 데이터: scripts/sections.json  (홈 섹션 + 기획전 정의)
// 동작: ① goodsNo들을 viaelite에서 긁어와 Product 로 upsert(=고도몰 상품 픽과 동일)
//       ② 같은 이름의 섹션/기획전이 있으면 재사용, 없으면 생성 → 상품 배치(순서대로)
// 주의: DATABASE_URL 이 가리키는 DB에 씁니다. 프로덕션에 넣으려면 .env 의 DATABASE_URL 을 프로덕션으로.
//       ⚠️ 절대 `npm run build`/`db push` 는 돌리지 말 것(파괴적). 이 스크립트는 그런 짓 안 함.

import "./loadenv"; // ← .env 를 먼저 로드 (prisma 생성 전에 DATABASE_URL 세팅)
import { readFileSync } from "node:fs";
import { importGoodsNos } from "../src/lib/godomall/import";
import { prisma } from "../src/lib/db";

interface SecDef { title: string; subtitle?: string; sort?: number; goods: string[] }
interface ExDef extends SecDef { bannerFrom?: string; bannerTo?: string; bannerImageUrl?: string }
interface Data { sections: SecDef[]; exhibitions?: ExDef[] }

const data: Data = JSON.parse(readFileSync(new URL("./sections.json", import.meta.url), "utf-8"));
const commit = process.argv.includes("--commit");

const allGoods = Array.from(
  new Set([...data.sections, ...(data.exhibitions ?? [])].flatMap((s) => s.goods.map(String)))
);

function plan() {
  console.log("── 업로드 계획 ──");
  console.log(`상품(중복 제거): ${allGoods.length}개`);
  console.log(`홈 섹션: ${data.sections.length}개`);
  data.sections.forEach((s) => console.log(`   · ${s.title} (${s.goods.length})`));
  console.log(`기획전: ${(data.exhibitions ?? []).length}개`);
  (data.exhibitions ?? []).forEach((e) => console.log(`   · ${e.title} (${e.goods.length})`));
}

async function setProducts(kind: "section" | "exhibition", id: string, goods: string[], idMap: Map<string, string>) {
  const productIds = goods.map((g) => idMap.get(g)).filter((v): v is string => !!v);
  if (kind === "section") {
    await prisma.$transaction([
      prisma.sectionProduct.deleteMany({ where: { sectionId: id } }),
      ...productIds.map((productId, i) => prisma.sectionProduct.create({ data: { sectionId: id, productId, sort: i } })),
    ]);
  } else {
    await prisma.$transaction([
      prisma.exhibitionProduct.deleteMany({ where: { exhibitionId: id } }),
      ...productIds.map((productId, i) => prisma.exhibitionProduct.create({ data: { exhibitionId: id, productId, sort: i } })),
    ]);
  }
  return productIds.length;
}

async function main() {
  plan();
  if (!commit) {
    console.log("\n※ 미리보기입니다. 실제로 등록하려면 끝에 --commit 을 붙이세요.");
    return;
  }

  console.log("\n① 상품 업로드(스크래핑+upsert)… 시간이 좀 걸립니다.");
  const r = await importGoodsNos(allGoods);
  console.log(`   신규 ${r.created} · 갱신 ${r.updated} · 실패 ${r.errors.length}`);
  if (r.errors.length) console.log("   실패 목록:", r.errors.slice(0, 10).join(" | "));

  // goodsNo → productId
  const products = await prisma.product.findMany({
    where: { goodsNo: { in: allGoods } },
    select: { id: true, goodsNo: true },
  });
  const idMap = new Map(products.map((p) => [p.goodsNo, p.id]));
  console.log(`   DB에서 매칭된 상품: ${idMap.size}/${allGoods.length}`);

  console.log("\n② 홈 섹션 생성/갱신…");
  for (const s of data.sections) {
    const existing = await prisma.section.findFirst({ where: { title: s.title } });
    const sec = existing ?? (await prisma.section.create({
      data: { title: s.title, subtitle: s.subtitle?.trim() || null, sort: s.sort ?? 0 },
    }));
    const n = await setProducts("section", sec.id, s.goods, idMap);
    console.log(`   ${existing ? "갱신" : "생성"}: ${s.title} — 상품 ${n}개 배치`);
  }

  console.log("\n③ 기획전 생성/갱신…");
  for (const e of data.exhibitions ?? []) {
    const existing = await prisma.exhibition.findFirst({ where: { title: e.title } });
    const ex = existing ?? (await prisma.exhibition.create({
      data: {
        title: e.title,
        subtitle: e.subtitle?.trim() || null,
        bannerImageUrl: e.bannerImageUrl?.trim() || null,
        bannerFrom: e.bannerFrom || "#e9dfd5",
        bannerTo: e.bannerTo || "#cdb7a6",
        sort: e.sort ?? 0,
      },
    }));
    const n = await setProducts("exhibition", ex.id, e.goods, idMap);
    console.log(`   ${existing ? "갱신" : "생성"}: ${e.title} — 상품 ${n}개 배치`);
  }

  console.log("\n✅ 완료. 홈/기획전에서 확인하세요.");
}

main()
  .catch((e) => { console.error("오류:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
