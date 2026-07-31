// 앱+리뷰 배너를 메인 최상단에 등록 (이미지에 텍스트가 이미 박혀 있어 title/subtitle은 비움)
//   실행: npx tsx scripts/set_review_banner.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

const IMG = "/banners/review_app_it.png";
const NOTICE_ID = "cms8pd5jf0000van7hmjolenc"; // 앱 다운로드+리뷰 공지

async function main() {
  const link = `/board/${NOTICE_ID}`;
  // 하단 발랄한 제목/설명 (컴포넌트가 흰 글씨로 얹음)
  const data = { title: "앱 설치하고 리뷰 쓰면 20%!", subtitle: "리뷰 인증하고 바우처 받아가세요 ⭐", imageUrl: IMG, linkUrl: link, sort: 0, active: true };
  // 이전 리뷰 배너(svg 또는 png) 레코드를 찾아 갱신
  const existing =
    (await prisma.banner.findFirst({ where: { imageUrl: "/banners/review_app.svg" } })) ??
    (await prisma.banner.findFirst({ where: { linkUrl: link } }));
  if (existing) { await prisma.banner.update({ where: { id: existing.id }, data }); console.log("갱신:", existing.id); }
  else { const b = await prisma.banner.create({ data }); console.log("생성:", b.id); }

  const all = await prisma.banner.findMany({ where: { active: true }, orderBy: { sort: "asc" }, select: { sort: true, title: true, imageUrl: true } });
  console.log("현재 배너 순서:");
  all.forEach((b) => console.log(`  [${b.sort}] ${b.title || "(텍스트배너)"} ${b.imageUrl}`));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; });
