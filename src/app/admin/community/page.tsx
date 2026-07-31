import { prisma } from "@/lib/db";
import { displayAuthor, getAllCommunityCategories, categoryLabelMap } from "@/lib/community";
import CommunityRow, { type Row } from "./CommunityRow";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(5, 10);
}

export default async function AdminCommunity() {
  const [posts, cats, labels] = await Promise.all([
    prisma.communityPost.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { partner: { select: { nickname: true, name: true } } },
    }),
    getAllCommunityCategories(),
    categoryLabelMap(),
  ]);

  const rows: Row[] = posts.map((p) => ({
    id: p.id,
    categoryLabel: labels.get(p.category) ?? p.category,
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
        커뮤니티 <b>카테고리</b>를 추가/숨김하고, 회원 글을 고정·숨김합니다. (리뷰·홍보 인증은 <b>인증 보상</b> 메뉴에서 확인)
      </p>

      <div className="mb-8">
        <CategoryManager categories={cats.map((c) => ({ id: c.id, key: c.key, label: c.label, active: c.active }))} />
      </div>

      <h2 className="mb-3 text-lg font-semibold">게시글</h2>
      {rows.length === 0 ? (
        <div className="card p-8 text-sm text-sub">아직 커뮤니티 글이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[560px] text-sm">
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
