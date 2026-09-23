// 대표 이미지가 없는 활성 상품을 비활성 처리 (연동 제외)
import "./loadenv";
import { prisma } from "../src/lib/db";

async function main() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, goodsNo: true, name: true, imagesJson: true, updatedAt: true },
  });
  const noImg = rows.filter((r) => {
    try {
      const arr = JSON.parse(r.imagesJson ?? "[]");
      return !Array.isArray(arr) || arr.length === 0 || !arr[0];
    } catch {
      return true;
    }
  });
  console.log("활성인데 이미지 없는 상품:", noImg.length);
  for (const r of noImg.slice(0, 10)) console.log(" -", r.goodsNo, r.name.slice(0, 40), "| updatedAt:", r.updatedAt.toISOString());
  if (noImg.length > 0) {
    const r = await prisma.product.updateMany({ where: { id: { in: noImg.map((x) => x.id) } }, data: { active: false } });
    console.log("비활성 처리:", r.count, "건");
  }
}
main().finally(() => prisma.$disconnect());
