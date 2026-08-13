import { prisma } from "@/lib/db";
import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  const s = new Date(d.getTime() + 9 * 3600_000).toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`;
}

export default async function AdminCommunityReports() {
  const reports = await prisma.communityReport.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const postIds = [...new Set(reports.map((r) => r.postId).filter(Boolean) as string[])];
  const commentIds = [...new Set(reports.map((r) => r.commentId).filter(Boolean) as string[])];
  const reporterIds = [...new Set(reports.map((r) => r.reporterId))];

  const [posts, comments, reporters] = await Promise.all([
    prisma.communityPost.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, content: true, partnerId: true, hidden: true } }),
    prisma.communityComment.findMany({ where: { id: { in: commentIds } }, select: { id: true, content: true, postId: true, partnerId: true } }),
    prisma.partner.findMany({ where: { id: { in: reporterIds } }, select: { id: true, name: true } }),
  ]);
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const commentMap = new Map(comments.map((c) => [c.id, c]));
  const reporterMap = new Map(reporters.map((p) => [p.id, p.name]));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">커뮤니티 신고 · 처리</h1>
      <p className="mb-5 text-sm text-sub">
        접수된 신고는 <b>24시간 내</b> 처리해 주세요. 게시글 숨김 / 댓글 삭제 / 회원 정지 후 <b>처리 완료</b>로 표시합니다.
      </p>

      {reports.length === 0 ? (
        <div className="card p-10 text-center text-sm text-sub">접수된 신고가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const post = r.postId ? postMap.get(r.postId) : null;
            const comment = r.commentId ? commentMap.get(r.commentId) : null;
            const authorId = comment?.partnerId ?? post?.partnerId ?? null;
            const isBlock = r.reason.startsWith("사용자 차단");
            return (
              <div key={r.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-sub">
                  <span className={`rounded px-2 py-0.5 font-bold ${isBlock ? "bg-red-100 text-red-700" : "bg-brandsoft text-brand"}`}>
                    {isBlock ? "차단" : comment ? "댓글 신고" : "게시글 신고"}
                  </span>
                  <span>사유: <b className="text-ink">{r.reason}</b></span>
                  <span>신고자: {reporterMap.get(r.reporterId) ?? "?"}</span>
                  <span className="ml-auto">{fmt(r.createdAt)}</span>
                </div>

                {!isBlock && (
                  <div className="mt-2 rounded-lg bg-[#f7f6f4] p-3 text-sm">
                    {post && (
                      <a href={`/community/${post.id}`} target="_blank" className="block">
                        <b>{post.title}</b> {post.hidden && <span className="text-xs text-amber-700">(숨김됨)</span>}
                        <span className="mt-0.5 line-clamp-2 text-ink/70">{post.content}</span>
                      </a>
                    )}
                    {comment && (
                      <a href={`/community/${comment.postId}`} target="_blank" className="block text-ink/80">
                        💬 {comment.content}
                      </a>
                    )}
                    {!post && !comment && <span className="text-sub">(원본이 이미 삭제됨)</span>}
                  </div>
                )}

                <div className="mt-3">
                  <ReportActions
                    reportId={r.id}
                    postId={post?.id ?? null}
                    commentId={comment?.id ?? null}
                    authorId={authorId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
