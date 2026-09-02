// 동일 상품 정리 — 브랜드+대표이미지 기준, 재고있고 차액 큰 하나만 남기고 나머지 비활성
//   미리보기:  npx tsx scripts/dedupe_products.ts
//   실제 실행: npx tsx scripts/dedupe_products.ts --commit
import "./loadenv";
import { dedupeActiveProducts } from "../src/lib/godomall/homeRefresh";
import { prisma } from "../src/lib/db";

async function main() {
  const commit = process.argv.includes("--commit");
  const r = await dedupeActiveProducts(commit);
  console.log(`동일상품 ${r.groups}그룹 · ${r.hidden}개 ${commit ? "비활성 처리" : "비활성 예정(미리보기)"}`);
  if (!commit) console.log("※ 실제 반영하려면 --commit");
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
