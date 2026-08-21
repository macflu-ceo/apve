// 베타 오픈: 기존 공지 전부 삭제 → 베타 공지 생성 → 코랄 배너 메인 등록
//   실행: npx tsx scripts/set_beta.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

const CONTENT = `돈버는 명품샵을 찾아주신 여러분 감사드립니다.

현재 2026년 8월 25일 베타 오픈하였습니다.

오류가 발생할 수 있으나 최선을 다해 수정하고 있습니다.

돈버는 명품샵은 명품 공급사인 주식회사 제이프리모인터내셔널에서 운영하고 있습니다.

여러분이 가입한 아이디에는 고유한 코드가 부여되어 있습니다. 이 코드가 들어간 상품 구매링크를 만드실 수 있는 것이 이 사이트의 핵심 기능입니다.

이 구매링크는 'VIA ELITE'라고 하는 온라인 몰의 상품 상세페이지로 이동하게 되며, 이 과정에서 고유한 코드를 인식해 판매자를 기록합니다.

여러분이 공유한 링크로 구매가 일어나면, 본인의 등급에 따라 상품 상세페이지에 명시된 수수료 금액이 마이페이지에 표시되며 1만원 단위로 현금 이체를 하실 수 있습니다.

주변에서 원하는 명품 브랜드 상품을 찾아 추천하고 돈을 받아보세요.

해당 쇼핑몰의 할인율은 정가(리테일가) 대비 할인율이기 때문에, 백화점보다 절반 가까이 저렴하게 추천하실 수 있습니다.

이런 좋은 정보를 많이 공유해주세요. 감사합니다.`;

async function main() {
  // 1) 기존 게시글(공지/가이드) 전부 삭제
  const del = await prisma.post.deleteMany({});
  console.log(`기존 게시글 삭제: ${del.count}개`);

  // 2) 베타 공지 생성 (통이미지 + 본문 텍스트)
  const post = await prisma.post.create({
    data: {
      category: "공지",
      title: "돈버는 명품샵 베타 오픈 안내",
      content: CONTENT,
      imagesJson: JSON.stringify(["/landing/notice_beta.jpg"]),
      pinned: true,
      published: true,
    },
  });
  console.log(`베타 공지 생성: ${post.id}`);

  // 3) 기존 배너 전부 비활성화 → 코랄 베타 배너를 메인 최상단에
  const off = await prisma.banner.updateMany({ where: { active: true }, data: { active: false } });
  console.log(`기존 배너 비활성화: ${off.count}개`);

  const link = `/board/${post.id}`;
  const existing = await prisma.banner.findFirst({ where: { imageUrl: "/banners/beta_coral.jpg" } });
  const data = { title: "", subtitle: null as string | null, imageUrl: "/banners/beta_coral.jpg", linkUrl: link, sort: 0, active: true };
  if (existing) { await prisma.banner.update({ where: { id: existing.id }, data }); console.log("베타 배너 갱신"); }
  else { const b = await prisma.banner.create({ data }); console.log("베타 배너 생성:", b.id); }

  console.log("\n✅ 완료. (이미지 파일은 git push 후 표시)");
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
