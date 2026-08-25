// 홈 섹션 상품을 '유명 브랜드(S→A 티어)' 위주로 카테고리 맞춰 교체
//   미리보기:  npx tsx scripts/refresh_home_brands.ts
//   실제 실행: npx tsx scripts/refresh_home_brands.ts --commit
import "./loadenv";
import "./catalogenv";
import { fetchCatalog, type CatalogItem } from "../src/lib/godomall/catalog";
import { importGoodsNos } from "../src/lib/godomall/import";
import { prisma } from "../src/lib/db";

const commit = process.argv.includes("--commit");
const PER_SECTION = 18;
const MAX_PER_BRAND = 4;
const FETCH_PER_BRAND = 120;
const MIN_DISCOUNT = 20; // 할인율 20% 이상만

// 브랜드 티어 (S=0 최상위 명품하우스, A=1 하이엔드 컨템·인기)
const BRANDS: { name: string; tier: number }[] = [
  ...["Gucci", "Prada", "Celine", "Dior", "Bottega Veneta", "Saint Laurent", "Balenciaga", "Fendi", "Valentino", "Givenchy", "Burberry", "Miu Miu", "Loro Piana", "Versace", "Ferragamo", "Moncler", "Tom Ford", "Alexander McQueen", "Max Mara", "Chloe", "Dolce & Gabbana", "Zegna"].map((name) => ({ name, tier: 0 })),
  ...["Jacquemus", "Maison Margiela", "The Row", "Toteme", "Khaite", "Thom Browne", "Off-White", "Ami", "Acne Studios", "Golden Goose", "Christian Louboutin", "Jimmy Choo", "Amina Muaddi", "Tod's", "Mulberry", "MCM", "Coach", "Tory Burch", "Longchamp", "Marni", "Isabel Marant", "Stone Island"].map((name) => ({ name, tier: 1 })),
];

// 섹션(현재 타이틀) → 카테고리 키워드 (goodsNm 매칭, 소문자)
const SECTIONS: { title: string; kw: string[] }[] = [
  { title: "발끝부터 다르게, 슈즈", kw: ["shoe", "boot", "loafer", "pump", "heel", "sneaker", "sandal", "mule", "ballerina", "슈즈", "부츠", "로퍼", "스니커", "힐", "샌들", "펌프스"] },
  { title: "데일리를 완성하는 가방", kw: ["bag", "tote", "hobo", "shoulder", "crossbody", "clutch", "backpack", "pouch", "minibag", "백", "가방", "토트", "숄더", "클러치", "백팩"] },
  { title: "간절기, 첫 아우터", kw: ["coat", "jacket", "blazer", "trench", "parka", "down", "outer", "bomber", "코트", "자켓", "아우터", "트렌치", "패딩", "블레이저", "점퍼"] },
  { title: "매일 입기 좋은 상의", kw: ["shirt", "tee", "t-shirt", "top", "blouse", "polo", "sweatshirt", "hoodie", "셔츠", "티셔츠", "탑", "블라우스", "폴로", "맨투맨", "후드"] },
  { title: "포인트 아이템", kw: ["belt", "scarf", "wallet", "cap", "hat", "sunglass", "jewel", "necklace", "earring", "bracelet", "card", "keyring", "벨트", "스카프", "지갑", "모자", "선글라스", "목걸이", "귀걸이", "카드"] },
  { title: "26FW, 지금 입는 니트", kw: ["knit", "sweater", "cardigan", "pullover", "turtleneck", "니트", "스웨터", "가디건", "풀오버"] },
  { title: "한 벌로 완성", kw: ["dress", "skirt", "jumpsuit", "gown", "set", "드레스", "원피스", "스커트", "점프수트", "세트업"] },
  { title: "바지부터 다르게", kw: ["pants", "trouser", "jeans", "denim", "shorts", "chino", "legging", "팬츠", "바지", "진", "데님", "슬랙스", "쇼츠", "치노"] },
];

type PoolItem = CatalogItem & { tier: number; cat: string; discount: number };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function detectCat(nm: string): string | null {
  const s = nm.toLowerCase();
  for (const sec of SECTIONS) if (sec.kw.some((k) => s.includes(k))) return sec.title;
  return null;
}

async function main() {
  console.log(`유명브랜드 홈 교체 · commit=${commit} · 브랜드 ${BRANDS.length}개`);
  const byGoods = new Map<string, PoolItem>();
  console.log("\n① 브랜드별 카탈로그 수집…");
  for (const b of BRANDS) {
    try {
      const r = await fetchCatalog({ brand: b.name, sort: "sales", inStock: true, limit: FETCH_PER_BRAND });
      let added = 0;
      for (const it of r.list) {
        // 가격 없는 상품 절대 제외 (판매가·정가 둘 다 유효해야 함)
        if (!it.sellPrice || it.sellPrice <= 0 || !it.listPrice || it.listPrice <= 0) continue;
        const d = Math.round((1 - it.sellPrice / it.listPrice) * 100);
        if (d < MIN_DISCOUNT) continue; // 할인율 20% 미만 제외
        const cat = detectCat(it.goodsNm || "");
        if (!cat) continue;
        const g = String(it.goodsNo);
        const prev = byGoods.get(g);
        if (!prev || b.tier < prev.tier) { byGoods.set(g, { ...it, tier: b.tier, cat, discount: d }); added++; }
      }
      process.stdout.write(`  ${b.name}: +${added}  `);
    } catch (e) { process.stdout.write(`  ${b.name}: 오류  `); }
    await sleep(150);
  }
  const pool = [...byGoods.values()];
  console.log(`\n   풀 ${pool.length}개 (카테고리 매칭됨)`);

  // 섹션별 선정 (티어 우선 → 브랜드 다양성 캡 → 전역 중복 방지)
  const used = new Set<string>();
  const plan: { title: string; goods: string[]; brands: string[]; dmin: number; dmax: number }[] = [];
  for (const sec of SECTIONS) {
    const cands = pool.filter((p) => p.cat === sec.title && !used.has(p.goodsNo))
      .sort((a, b) => a.tier - b.tier || b.discount - a.discount);
    const perBrand = new Map<string, number>();
    const picked: PoolItem[] = [];
    const bkey = (b: string) => b.toLowerCase().replace(/homme|christian|garavani|studios?/g, "").replace(/[^a-z가-힣]/g, "");
    for (const p of cands) {
      const k = bkey(p.brand);
      const c = perBrand.get(k) || 0;
      if (c >= MAX_PER_BRAND) continue;
      picked.push(p); perBrand.set(k, c + 1); used.add(p.goodsNo);
      if (picked.length >= PER_SECTION) break;
    }
    const ds = picked.map((p) => p.discount);
    plan.push({ title: sec.title, goods: picked.map((p) => p.goodsNo), brands: [...new Set(picked.map((p) => `${p.brand}`))], dmin: ds.length ? Math.min(...ds) : 0, dmax: ds.length ? Math.max(...ds) : 0 });
  }

  console.log("\n② 섹션별 선정 결과 (할인율):");
  for (const s of plan) console.log(`  ${s.title}: ${s.goods.length}개 · 할인 ${s.dmin}~${s.dmax}% · ${s.brands.slice(0, 7).join(", ")}`);

  if (!commit) { console.log("\n※ 미리보기. --commit 붙이면 import + 섹션 교체."); return; }

  console.log("\n③ 상품 import(스크래핑)…");
  const allGoods = [...new Set(plan.flatMap((s) => s.goods))];
  const r = await importGoodsNos(allGoods);
  console.log(`   신규 ${r.created} · 갱신 ${r.updated} · 실패 ${r.errors.length}`);

  const prods = await prisma.product.findMany({ where: { goodsNo: { in: allGoods } }, select: { id: true, goodsNo: true } });
  const idBy = new Map(prods.map((p) => [p.goodsNo, p.id]));

  console.log("\n④ 섹션 상품 교체…");
  for (const s of plan) {
    const sec = await prisma.section.findFirst({ where: { title: s.title } });
    if (!sec) { console.log(`  (섹션 없음: ${s.title})`); continue; }
    const ids = s.goods.map((g) => idBy.get(g)).filter((v): v is string => !!v);
    await prisma.$transaction([
      prisma.sectionProduct.deleteMany({ where: { sectionId: sec.id } }),
      ...ids.map((productId, i) => prisma.sectionProduct.create({ data: { sectionId: sec.id, productId, sort: i } })),
    ]);
    console.log(`  ${s.title}: ${ids.length}개 배치`);
  }
  console.log("\n✅ 완료. 홈 새로고침으로 확인하세요. (DB라 push 불필요)");
}

main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
