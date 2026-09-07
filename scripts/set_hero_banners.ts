// 메인 배너 이미지·문구 교체 (링크는 유지) — 화보 + 큰문구(title) + 작은설명(subtitle)
import "./loadenv";
import { prisma } from "../src/lib/db";

// 링크(게시글 ID) → 새 이미지/문구 매핑
const MAP: { match: string; imageUrl: string; title: string; subtitle: string }[] = [
  { match: "cmt36v6iv", imageUrl: "/banners/vb1.jpg", title: "컨시어지 되면 수수료 12%", subtitle: "누적 판매로 등급 업, 더 큰 수수료" }, // 컨시어지
  { match: "cmt36v7cl", imageUrl: "/banners/vb2.jpg", title: "첫 판매 수수료 20%",     subtitle: "가입하고 첫 판매하면 20% 지급" },   // 첫판매
  { match: "cmt36v70r", imageUrl: "/banners/vb3.jpg", title: "20% 바우처 받기",        subtitle: "리뷰·홍보 인증하면 즉시 지급" },     // 바우처
  { match: "cmt2yoqq9", imageUrl: "/banners/vb4.jpg", title: "지금, 베타 오픈",         subtitle: "돈버는 명품샵에서 바로 시작" },      // 베타
];

async function main() {
  const commit = process.argv.includes("--commit");
  const banners = await prisma.banner.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }] });
  for (const b of banners) {
    const m = MAP.find((x) => (b.linkUrl ?? "").includes(x.match));
    if (!m) { console.log(`(매칭없음) sort=${b.sort} link=${b.linkUrl}`); continue; }
    console.log(`${commit ? "적용" : "예정"}: [${b.sort}] ${m.title} · ${m.imageUrl} (링크 유지: ${b.linkUrl})`);
    if (commit) {
      await prisma.banner.update({ where: { id: b.id }, data: { imageUrl: m.imageUrl, title: m.title, subtitle: m.subtitle } });
    }
  }
  if (!commit) console.log("\n※ 미리보기. --commit 붙이면 반영 (링크는 안 건드림).");
  else console.log("\n✅ 배너 교체 완료 (링크 유지). 홈 새로고침으로 확인.");
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
