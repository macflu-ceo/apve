// 3개 공지 등록: 컨시어지 / 바우처 / 첫판매20% (통이미지 + 실제 CTA 버튼 마커)
//   실행: npx tsx scripts/set_notices3.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

interface N { title: string; content: string; img: string }
const NOTICES: N[] = [
  {
    title: "컨시어지가 되는 방법",
    img: "/landing/notice_concierge.jpg",
    content:
`돈버는 명품샵에서 판매하는 상품들은 정가 대비 높은 할인율을 갖고 있어 판매하기 쉽습니다.

다만, 판매했을 때 산정되는 수수료 %가 컨시어지와 일반회원이 다릅니다.

일반회원도 컨시어지가 될 수 있어요. 신청하시면 됩니다.

컨시어지는 더 많은 혜택을 받는 만큼 실적이 필요합니다! 실적은 업데이트되며, 컨시어지 전용 게시판을 통해 변동사항이 전달됩니다.

열심히 활동해서 컨시어지에 대한 꿈을 키워보세요!

신청은 마이페이지에서 가능합니다.
[[CTA:마이페이지에서 신청하기|/me]]`,
  },
  {
    title: "바우처 받는 방법",
    img: "/landing/notice_voucher.jpg",
    content:
`첫 구매에 이어서 또 한 번 20% 수수료를 받을 수 있는 방법!
(예: 200만원 가방 팔면 40만원 수익)

앱 리뷰나 커뮤니티에 판매 후기글을 작성해주세요. 커뮤니티로 이동해 '글 작성'을 누르고 이미지를 첨부하면 후기 사진을 업로드할 수 있습니다.

판매 후기를 올려주신 분께는 20% 바우처를 드려요.

바우처는 제품 상세페이지에서 적용할 수 있고, 최초 1회 판매에 한해 20% 수수료를 지급해드립니다.
[[CTA:커뮤니티에 후기 쓰기|/community]]`,
  },
  {
    title: "앱 오픈 기념, 첫 판매 수수료 20%",
    img: "/landing/notice_firstsale.jpg",
    content:
`두근두근 설레는 첫 판매는 20%의 수수료로 측정됩니다.

최초 판매 이후에는 7% 수수료로 고정되고, 컨시어지로 가입하신 분들은 12%가 됩니다.
[[CTA:상품 둘러보기|/category]]`,
  },
];

async function main() {
  for (const n of NOTICES) {
    const existing = await prisma.post.findFirst({ where: { title: n.title } });
    const data = { category: "공지", content: n.content, imagesJson: JSON.stringify([n.img]), pinned: true, published: true };
    if (existing) { await prisma.post.update({ where: { id: existing.id }, data }); console.log("갱신:", n.title); }
    else { const p = await prisma.post.create({ data: { title: n.title, ...data } }); console.log("생성:", n.title, p.id); }
  }
  console.log("\n✅ 완료. (이미지는 git push 후 표시)");
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
