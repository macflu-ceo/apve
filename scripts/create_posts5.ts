// 앱 다운로드 + 리뷰 → 20% 바우처 공지
//   실행: npx tsx scripts/create_posts5.ts
import "./loadenv";
import { prisma } from "../src/lib/db";

const TITLE = "앱 다운로드하고 리뷰 남기면 수수료 20% 바우처를 드려요";
const CONTENT =
`돈버는 명품샵 앱을 설치하고 스토어에 리뷰를 남겨주세요. 그 리뷰를 인증하면 20% 수수료 바우처를 드립니다.

[왜 앱인가요]
· 특가, 타임세일, 새 상품 소식을 푸시 알림으로 가장 빠르게 받아볼 수 있어요.
· 앱에서 더 편하게 링크를 공유하고 판매를 관리할 수 있어요.

[이렇게 하면 20% 바우처]
1. 앱을 설치하세요. (웹 화면 상단의 '앱 다운로드' 버튼으로 설치할 수 있어요.)
2. 앱스토어 또는 플레이스토어에 솔직한 리뷰를 남겨주세요.
3. 마이페이지의 '⭐ 리뷰·홍보 인증하고 20% 받기'에서 '리뷰 인증'을 골라, 남긴 리뷰 화면을 캡처해 제출하세요.
4. 관리자 확인 후 승인되면 20% 바우처가 지급됩니다.

[받은 바우처는]
· 원하는 상품 상세페이지에서 '⭐ 이 상품에 20% 바우처 적용'을 누르면, 그 상품의 최초 판매 1건에 20% 수수료가 적용돼요.
· 내 바우처는 마이페이지에서 사용가능 / 적용중 / 사용완료로 확인할 수 있어요.

지금 앱을 설치하고, 리뷰 한 줄로 20% 혜택을 받아보세요.`;

async function main() {
  const existing = await prisma.post.findFirst({ where: { title: TITLE } });
  const data = { category: "공지", content: CONTENT, pinned: true, published: true };
  if (existing) { await prisma.post.update({ where: { id: existing.id }, data }); console.log("갱신:", TITLE, existing.id); }
  else { const c = await prisma.post.create({ data: { title: TITLE, ...data } }); console.log("생성:", TITLE, c.id); }
  await prisma.$disconnect();
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; });
