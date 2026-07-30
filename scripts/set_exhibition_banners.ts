// 기획전 상단 배너 이미지 연결 (public/exhibitions/*.png → bannerImageUrl)
//   실행: npx tsx scripts/set_exhibition_banners.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

const MAP: { title: string; img: string }[] = [
  { title: "할인율 높은 상품", img: "/exhibitions/discount.png" },
  { title: "구찌 신상 모음전", img: "/exhibitions/gucci.png" },
  { title: "프라다 신상 모음전", img: "/exhibitions/prada.png" },
  { title: "프리미엄 하이엔드", img: "/exhibitions/premium.png" },
];

async function main() {
  for (const m of MAP) {
    const ex = await prisma.exhibition.findFirst({ where: { title: m.title } });
    if (!ex) { console.log(`(없음) ${m.title}`); continue; }
    await prisma.exhibition.update({ where: { id: ex.id }, data: { bannerImageUrl: m.img } });
    console.log(`연결: ${m.title} → ${m.img}`);
  }
  console.log("\n✅ 완료. (이미지는 git push 후 표시)");
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
