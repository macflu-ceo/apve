// 배너 4장 등록(기존 배너는 비활성화) + 공지/가이드 게시글에 대표 이미지 삽입
//   실행: npx tsx scripts/setup_banners_images.ts
// 이미지는 public/banners/*.png (배포 후 /banners/*.png 로 서빙됨)
import "./loadenv";
import { prisma } from "../src/lib/db";

async function postId(title: string): Promise<string | null> {
  const p = await prisma.post.findFirst({ where: { title }, select: { id: true } });
  return p?.id ?? null;
}
async function exId(title: string): Promise<string | null> {
  const e = await prisma.exhibition.findFirst({ where: { title }, select: { id: true } });
  return e?.id ?? null;
}

async function upsertBanner(b: { title: string; subtitle: string; imageUrl: string; linkUrl: string; sort: number }) {
  const existing = await prisma.banner.findFirst({ where: { title: b.title } });
  const data = { subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl, sort: b.sort, active: true };
  if (existing) { await prisma.banner.update({ where: { id: existing.id }, data }); return "갱신"; }
  await prisma.banner.create({ data: { title: b.title, ...data } });
  return "생성";
}

async function setPostImage(title: string, imageUrl: string) {
  const p = await prisma.post.findFirst({ where: { title } });
  if (!p) { console.log(`  (게시글 없음: ${title})`); return; }
  await prisma.post.update({ where: { id: p.id }, data: { imagesJson: JSON.stringify([imageUrl]) } });
  console.log(`  이미지 삽입: ${title}`);
}

async function main() {
  // 링크 대상 조회
  const [pEvent, pProof, pGuide, pCompany, pSystem, pConcierge] = await Promise.all([
    postId("오픈 기념 이벤트, 첫 판매 수수료 20% 드립니다"),
    postId("모든 상품은 100% 정품입니다"),
    postId("돈버는 명품샵 이용 가이드"),
    postId("주식회사 제이프리모인터내셔널을 소개합니다"),
    postId("돈버는 명품샵은 이렇게 운영됩니다"),
    postId("컨시어지가 되면 누리는 혜택"),
  ]);
  const exSale = await exId("지금 놓치면 손해 · 특가 셀렉션");

  // 1) 기존 배너 전부 비활성화
  const off = await prisma.banner.updateMany({ where: { active: true }, data: { active: false } });
  console.log(`기존 배너 비활성화: ${off.count}개`);

  // 2) 새 배너 4장
  const banners = [
    { title: "이탈리아 부티크 직수입", subtitle: "정가 대비 최대 70% 특가 · 100% 정품", imageUrl: "/banners/banner1.png", linkUrl: pProof ? `/board/${pProof}` : "/board", sort: 1 },
    { title: "오픈 기념, 첫 판매 수수료 20%", subtitle: "링크만 공유하면 됩니다", imageUrl: "/banners/banner2.png", linkUrl: pEvent ? `/board/${pEvent}` : "/board", sort: 2 },
    { title: "마진업 타임세일", subtitle: "한정 시간, 수수료가 올라갑니다", imageUrl: "/banners/banner3.png", linkUrl: exSale ? `/exhibition/${exSale}` : "/timesale", sort: 3 },
    { title: "3분이면 첫 판매 링크", subtitle: "지금 시작하고 가이드 보기", imageUrl: "/banners/banner4.png", linkUrl: pGuide ? `/board/${pGuide}` : "/board", sort: 4 },
  ];
  console.log("새 배너 등록:");
  for (const b of banners) console.log(`  ${await upsertBanner(b)}: ${b.title} → ${b.linkUrl}`);

  // 3) 게시글 대표 이미지 (배너 이미지 재사용)
  console.log("게시글 이미지 삽입:");
  await setPostImage("주식회사 제이프리모인터내셔널을 소개합니다", "/banners/banner1.png");
  await setPostImage("오픈 기념 이벤트, 첫 판매 수수료 20% 드립니다", "/banners/banner2.png");
  await setPostImage("돈버는 명품샵은 이렇게 운영됩니다", "/banners/banner4.png");
  await setPostImage("모든 상품은 100% 정품입니다", "/banners/banner1.png");
  await setPostImage("컨시어지가 되면 누리는 혜택", "/banners/banner3.png");

  console.log("\n✅ 완료. (이미지는 git push → 배포 후 표시됩니다)");
}

main().catch((e) => { console.error("오류:", e.message || e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
