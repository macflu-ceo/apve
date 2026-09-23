// 이미지가 비어 비활성된 상품을 다시 스크래핑해 복구한다.
// (수집 당시 일시적 실패로 0장이 저장돼 굳은 건들)
import "./loadenv";
import { prisma } from "../src/lib/db";
import { scrapeProduct } from "../src/lib/godomall/scrape";
import { goodsViewUrl } from "../src/lib/godomall/import";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const rows = await prisma.product.findMany({
    where: { OR: [{ imagesJson: null }, { imagesJson: "[]" }] },
    select: { id: true, goodsNo: true, name: true, stock: true },
  });
  console.log("이미지 없는 상품:", rows.length, "건 — 재수집 시작\n");

  let recovered = 0, still = 0, failed = 0;
  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    try {
      const s = await scrapeProduct(goodsViewUrl(p.goodsNo));
      if (s.images.length > 0) {
        // 재고가 있으면 다시 노출, 없으면 이미지만 채워두고 비활성 유지
        await prisma.product.update({
          where: { id: p.id },
          data: { imagesJson: JSON.stringify(s.images), active: (p.stock ?? 0) > 0 },
        });
        recovered++;
        console.log(`✓ ${p.goodsNo} ${p.name.slice(0, 34)} — ${s.images.length}장 복구${(p.stock ?? 0) > 0 ? " · 재노출" : " (재고0, 비활성 유지)"}`);
      } else {
        still++;
      }
    } catch (e) {
      failed++;
      console.log(`✗ ${p.goodsNo} — ${e instanceof Error ? e.message : e}`);
    }
    // 비아엘리떼 IP 차단 이력이 있어 간격을 둔다
    await sleep(700);
    if ((i + 1) % 20 === 0) console.log(`   …${i + 1}/${rows.length}`);
  }
  console.log(`\n복구 ${recovered} · 원래 이미지 없음 ${still} · 실패 ${failed}`);
}
main().finally(() => prisma.$disconnect());
