// 이미지 없는 상품 현황 카운트 (복구 진행 상황 확인용)
import "./loadenv";
import { prisma } from "../src/lib/db";

async function main() {
  const none = await prisma.product.count({ where: { OR: [{ imagesJson: null }, { imagesJson: "[]" }] } });
  const activeNone = await prisma.product.count({ where: { active: true, OR: [{ imagesJson: null }, { imagesJson: "[]" }] } });
  const total = await prisma.product.count();
  const active = await prisma.product.count({ where: { active: true } });
  console.log(`전체 ${total} · 활성 ${active} | 이미지 없음 ${none} (그중 활성 ${activeNone})`);
}
main().finally(() => prisma.$disconnect());
