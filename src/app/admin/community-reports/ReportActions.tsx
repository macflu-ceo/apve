"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReport, hideReportedPost, deleteReportedComment, suspendReportedUser } from "./actions";

export default function ReportActions({
  reportId,
  postId,
  commentId,
  authorId,
}: {
  reportId: string;
  postId?: string | null;
  commentId?: string | null;
  authorId?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div className="flex flex-wrap gap-1.5">
      {postId && (
        <button onClick={() => run(() => hideReportedPost(postId))} disabled={pending} className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200">
          게시글 숨김
        </button>
      )}
      {commentId && (
        <button onClick={() => run(() => deleteReportedComment(commentId))} disabled={pending} className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">
          댓글 삭제
        </button>
      )}
      {authorId && (
        <button onClick={() => { if (confirm("이 회원 이용을 정지할까요? (로그인 차단)")) run(() => suspendReportedUser(authorId)); }} disabled={pending} className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">
          회원 정지
        </button>
      )}
      <button onClick={() => run(() => resolveReport(reportId))} disabled={pending} className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-200">
        처리 완료
      </button>
    </div>
  );
}
