// 이번 공지 3종을 홈 배너로도 등록 (각 공지로 연결)
//   실행: npx tsx scripts/set_beta_banners.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

const BANNERS = [
  { img: "/banners/beta_firstsale.jpg", postId: "cmt36v7cl0002j9q93h2njm5b", sort: 1 }, // 첫 판매 20%
  { img: "/banners/beta_voucher.jpg", postId: "cmt36v70r0001j9q9mu7ii5ok", sort: 2 },   // 바우처
  { img: "/banners/beta_concierge.jpg", postId: "cmt36v6iv0000j9q9dd8hb38o", sort: 3 }, // 컨시어지
];

async function main() {
  for (const b of BANNERS) {
    const link = `/board/${b.postId}`;
    const data = { title: "", subtitle: null as string | null, imageUrl: b.img, linkUrl: link, sort: b.sort, active: true };
    const existing = await prisma.banner.findFirst({ where: { imageUrl: b.img } });
    if (existing) { await prisma.banner.update({ where: { id: existing.id }, data }); console.log("갱신:", b.img); }
    else { const c = await prisma.banner.create({ data }); console.log("생성:", b.img, c.id); }
  }
  const all = await prisma.banner.findMany({ where: { active: true }, orderBy: { sort: "asc" }, select: { sort: true, imageUrl: true, linkUrl: true } });
  console.log("\n활성 배너 순서:");
  all.forEach((x) => console.log(`  [${x.sort}] ${x.imageUrl} → ${x.linkUrl}`));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; });
