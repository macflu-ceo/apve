"use client";

// 신고 / 차단 컨트롤 — 게시글·댓글 공용. 본인 콘텐츠가 아닐 때만 노출.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportContent, blockAuthor } from "../actions";

const REASONS = ["스팸/광고", "욕설/비방", "음란/불법", "혐오 발언", "기타"];

export default function ContentModeration({
  postId,
  commentId,
  authorId,
  kind,
}: {
  postId?: string;
  commentId?: string;
  authorId: string;
  kind: string; // "게시글" | "댓글"
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [openMenu, setOpenMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function submitReport(reason: string) {
    start(async () => {
      const r = await reportContent({ postId, commentId, reason });
      setReporting(false);
      setOpenMenu(false);
      setDone(r.message);
      setTimeout(() => setDone(null), 2500);
    });
  }

  function doBlock() {
    if (!confirm("이 회원을 차단할까요? 이 회원의 글과 댓글이 더 이상 보이지 않습니다.")) return;
    start(async () => {
      const r = await blockAuthor(authorId);
      setOpenMenu(false);
      setDone(r.message);
      router.refresh();
      setTimeout(() => setDone(null), 2500);
    });
  }

  if (done) return <span className="text-[11px] text-brand">{done}</span>;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpenMenu((v) => !v)}
        className="text-[11px] text-sub underline hover:text-ink"
        aria-label={`${kind} 신고/차단`}
      >
        ⋯ 신고
      </button>

      {openMenu && !reporting && (
        <div className="absolute right-0 top-5 z-30 w-40 rounded-xl border border-line bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="block w-full px-3 py-2 text-left text-xs hover:bg-[#f7f6f4]"
          >
            🚩 {kind} 신고
          </button>
          <button
            type="button"
            onClick={doBlock}
            disabled={pending}
            className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
          >
            🚫 이 회원 차단
          </button>
        </div>
      )}

      {openMenu && reporting && (
        <div className="absolute right-0 top-5 z-30 w-44 rounded-xl border border-line bg-white py-1 shadow-lg">
          <div className="px-3 py-1.5 text-[11px] font-bold text-sub">신고 사유</div>
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => submitReport(r)}
              disabled={pending}
              className="block w-full px-3 py-2 text-left text-xs hover:bg-[#f7f6f4]"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
