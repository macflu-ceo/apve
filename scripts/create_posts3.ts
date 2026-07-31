// 커뮤니티 + 20% 바우처 안내 공지
//   실행: npx tsx scripts/create_posts3.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

interface P { category: "공지" | "가이드"; title: string; content: string; pinned?: boolean; published: boolean }

const POSTS: P[] = [
  {
    category: "공지", pinned: true, published: true,
    title: "커뮤니티가 열렸어요, 후기와 노하우를 나눠주세요",
    content:
`이제 셀러님들이 직접 글을 쓰고 소통하는 커뮤니티가 열렸습니다. 상단 메뉴의 '커뮤니티'에서 바로 확인하세요.

[세 가지 게시판]
· 리뷰인증 — 상품을 구매하거나 사용한 후기를 인증해요. (스토어 리뷰 캡처 등)
· 홍보인증 — SNS, 블로그, 단톡방 등에 홍보한 화면을 인증해요.
· 판매 노하우 — 어떻게 팔았는지, 나만의 팁을 자유롭게 공유해요.

[닉네임으로 활동해요]
· 커뮤니티 글은 실명 대신 닉네임으로 표시됩니다.
· 닉네임은 2~12자, 다른 사람과 겹치지 않는 고유한 이름으로 마이페이지에서 설정하세요.

[이렇게 쓰면 돼요]
· 글마다 사진을 최대 4장까지 첨부할 수 있어요. 인증샷은 잘 보이게 올려주세요.
· 작성, 열람, 삭제 모두 자유롭게 할 수 있습니다.
· 공지와 가이드는 커뮤니티 위에 고정되어 언제든 볼 수 있어요.

[좋은 글엔 보상이 있어요]
정성껏 남긴 인증글과 노하우에는 관리자가 '20% 바우처'를 드립니다. 자세한 내용은 '커뮤니티 글 쓰고 수수료 20% 바우처 받으세요' 공지를 확인하세요.`,
  },
  {
    category: "공지", pinned: true, published: true,
    title: "커뮤니티 글 쓰고 수수료 20% 바우처 받으세요",
    content:
`커뮤니티에 좋은 글을 남기면, 원하는 상품 하나의 수수료를 20%로 올릴 수 있는 '20% 바우처'를 드립니다.

[어떻게 받나요]
· 커뮤니티(리뷰인증 · 홍보인증 · 판매 노하우)에 글을 씁니다.
· 관리자가 확인 후, 괜찮은 글에 20% 바우처를 지급합니다. (글 1개당 1회)

[어떻게 쓰나요]
· 바우처를 쓰고 싶은 상품의 상세페이지로 가서 '⭐ 이 상품에 20% 바우처 적용' 버튼을 누르면, 그 상품에 배정됩니다.
· 적용하면 그 상품의 '최초 판매 1건'에 20%가 적용됩니다.

[꼭 알아두세요]
· 최초 1건만 20%입니다. 그 상품이 처음 팔린 1건만 20% 수수료가 적용되고, 이후 판매는 원래 등급 요율(예: 일반 7%)로 돌아갑니다.
· 그래서 여러 개 팔려도 20%는 딱 한 건입니다. 정말 잘 팔릴 것 같은 상품에 적용하는 게 유리해요.
· 한 번 적용한 바우처는 취소할 수 없으니 신중히 선택하세요.

[내 바우처 확인]
· 마이페이지에서 사용가능 / 적용중(어떤 상품에 걸어뒀는지) / 사용완료로 나눠 볼 수 있어요.
· 20%가 적용된 판매는 판매내역에 '20%' 배지로 표시됩니다.

[오픈 이벤트 20%와는 별개예요]
· 오픈 이벤트 20%는 '첫 판매 1건'에 자동으로 적용되는 혜택이고,
· 20% 바우처는 커뮤니티 활동에 대한 보상으로, 원하는 상품에 추가로 적용하는 혜택입니다. 둘 다 챙기시면 됩니다.`,
  },
];

async function main() {
  for (const p of POSTS) {
    const existing = await prisma.post.findFirst({ where: { title: p.title } });
    const data = { category: p.category, content: p.content, pinned: p.pinned ?? false, published: p.published };
    if (existing) { await prisma.post.update({ where: { id: existing.id }, data }); console.log(`갱신 ${p.title}`); }
    else { await prisma.post.create({ data: { title: p.title, ...data } }); console.log(`생성 ${p.title}`); }
  }
  console.log("\n✅ 완료.");
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
