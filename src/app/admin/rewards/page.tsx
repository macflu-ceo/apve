import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { displayAuthor } from "@/lib/community";
import RewardRow, { type Row } from "./RewardRow";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ");
}

export default async function AdminRewards() {
  const subs = await prisma.rewardSubmission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { partner: { select: { nickname: true, name: true } } },
  });
  const pendingCount = subs.filter((s) => s.status === "pending").length;

  const rows: Row[] = subs.map((s) => ({
    id: s.id,
    type: s.type,
    author: displayAuthor(s.partner),
    content: s.content,
    images: parseList(s.imagesJson),
    status: s.status,
    createdAt: fmt(s.createdAt),
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">
        리뷰·홍보 인증 <span className="text-brand">({pendingCount} 대기)</span>
      </h1>
      <p className="mb-6 text-sm text-sub">
        회원이 마이페이지에서 제출한 <b>리뷰·홍보 인증</b>입니다. (커뮤니티엔 공개 안 됨) 승인하면 <b>20% 바우처</b>가 지급돼요.
      </p>

      {rows.length === 0 ? (
        <div className="card p-8 text-sm text-sub">제출된 인증이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <RewardRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
