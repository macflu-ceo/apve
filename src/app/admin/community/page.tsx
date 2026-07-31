import { prisma } from "@/lib/db";
import { displayAuthor } from "@/lib/community";
import CommunityRow, { type Row } from "./CommunityRow";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(5, 10);
}

export default async function AdminCommunity() {
  const posts = await prisma.communityPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { partner: { select: { nickname: true, name: true } } },
  });

  const rows: Row[] = posts.map((p) => ({
    id: p.id,
    category: p.category,
    title: p.title,
    author: displayAuthor(p.partner),
    hidden: p.hidden,
    pinned: p.pinned,
    rewarded: p.rewarded,
    hasImage: !!p.imagesJson,
    createdAt: fmt(p.createdAt),
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">커뮤니티 관리</h1>
      <p className="mb-6 text-sm text-sub">
        회원 글(리뷰인증·홍보인증·판매노하우)을 확인하고, 좋은 글엔 <b>20% 바우처</b>를 지급하세요. 고정·숨김도 가능합니다.
        (지급한 바우처는 회원이 원하는 상품에 적용 → 그 상품 최초 판매 1건에 20% 적용)
      </p>

      {rows.length === 0 ? (
        <div className="card p-8 text-sm text-sub">아직 커뮤니티 글이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-[#f7f6f4] text-left text-xs text-sub">
              <tr>
                <th className="px-3 py-2">글</th>
                <th className="px-3 py-2 text-center">보상</th>
                <th className="px-3 py-2 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <CommunityRow key={p.id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
