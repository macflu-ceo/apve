// 커뮤니티(판매 노하우) + 마이페이지 리뷰·홍보 인증 → 20% 바우처 공지 (재작성)
//   실행: npx tsx scripts/create_posts4.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

interface P { category: "공지" | "가이드"; title: string; content: string; pinned?: boolean; published: boolean }

const USE_VOUCHER =
`[받은 바우처 쓰는 법]
· 원하는 상품 상세페이지에서 '⭐ 이 상품에 20% 바우처 적용'을 누르면 그 상품에 배정돼요.
· 그 상품의 '최초 판매 1건'에만 20% 수수료가 적용됩니다. (이후 판매는 원래 등급 요율로 돌아가요)
· 여러 개 팔려도 20%는 딱 한 건이니, 잘 팔릴 것 같은 상품에 적용하세요. 한 번 적용하면 취소할 수 없어요.
· 내 바우처는 마이페이지에서 사용가능 / 적용중 / 사용완료로 확인할 수 있어요.`;

const POSTS: P[] = [
  {
    category: "공지", pinned: true, published: true,
    title: "판매 노하우를 나누면 수수료 20% 바우처를 드려요",
    content:
`상단 메뉴 '커뮤니티'에 판매 노하우를 공유해 주세요. 다른 셀러에게 유익한 글에는 관리자가 20% 수수료 바우처를 드립니다.

[판매 노하우 커뮤니티]
· 어떻게 팔았는지, 어떤 채널이 반응이 좋았는지, 고객을 움직인 한마디 등 나만의 판매 팁을 자유롭게 올려주세요.
· 사진도 함께 첨부하면 더 좋아요.
· 커뮤니티 글은 닉네임으로 표시됩니다. (닉네임은 2~12자, 마이페이지에서 설정)

[유익한 글엔 20% 바우처]
· 관리자가 글을 확인해, 다른 셀러에게 실제로 도움이 되는 유익한 노하우라면 20% 바우처를 지급합니다. (글 1개당 1회)

${USE_VOUCHER}

좋은 노하우는 커뮤니티 전체를 키우고, 보상으로 다시 돌아옵니다.`,
  },
  {
    category: "공지", pinned: true, published: true,
    title: "스토어 리뷰와 홍보를 인증하면 수수료 20% 바우처를 드려요",
    content:
`상품을 구매하고 리뷰를 남기거나, 다른 사람에게 우리 상품을 홍보했다면, 마이페이지에서 인증하고 20% 바우처를 받으세요.

[어디서 하나요]
· 마이페이지의 '⭐ 리뷰·홍보 인증하고 20% 받기'에서 '인증 제출' 버튼으로 제출합니다.
· 이 인증은 커뮤니티에 공개되지 않고, 관리자만 확인합니다.

[두 가지 인증]
· 리뷰 인증 — 스토어에 남긴 구매·사용 후기를 인증해요.
· 홍보 인증 — SNS, 블로그, 단톡방 등에서 다른 사람에게 홍보한 것을 인증해요.

[제출 방법]
· 인증 종류(리뷰/홍보)를 고르고, 인증 사진을 1장 이상 첨부한 뒤, 어떻게 리뷰하거나 홍보했는지 간단히 적어 제출하면 됩니다.
· 제출 후 관리자 확인을 거쳐 승인되면 20% 바우처가 지급됩니다. ('승인·20% 지급'으로 표시돼요)

${USE_VOUCHER}

진짜 후기와 진짜 홍보만 인증해 주세요. 허위나 도용으로 확인되면 지급되지 않습니다.`,
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
