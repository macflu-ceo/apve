"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLike, addComment, deleteComment } from "../actions";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import ContentModeration from "./ContentModeration";

type Comment = { id: string; authorId: string; author: string; content: string; createdAt: string; mine: boolean };

export default function CommentsSection({
  postId,
  likeCount,
  liked,
  canInteract,
  loggedIn,
  comments,
}: {
  postId: string;
  likeCount: number;
  liked: boolean;
  canInteract: boolean;
  loggedIn: boolean;
  comments: Comment[];
}) {
  const router = useRouter();
  const { open } = useAuthModal();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");

  // 낙관적 좋아요 표시
  const [likeOn, setLikeOn] = useState(liked);
  const [likeN, setLikeN] = useState(likeCount);

  function like() {
    start(async () => {
      const r = await toggleLike(postId);
      if (r.needAuth) return open("login");
      if (r.ok) {
        setLikeOn(r.liked);
        setLikeN((n) => n + (r.liked ? 1 : -1));
        router.refresh();
      }
    });
  }

  function submit() {
    if (!text.trim()) return;
    start(async () => {
      const r = await addComment(postId, text);
      if (r.needAuth) return open("login");
      if (r.ok) {
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-6 border-t border-line pt-4">
      {/* 좋아요 */}
      <button
        onClick={like}
        disabled={pending}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition ${
          likeOn ? "border-red-300 bg-red-50 text-red-600" : "border-line text-ink/70 hover:border-ink/30"
        }`}
      >
        <span>{likeOn ? "❤️" : "🤍"}</span> 좋아요 {likeN}
      </button>

      {/* 댓글 */}
      <div className="mt-5">
        <div className="mb-3 text-sm font-bold">댓글 {comments.length}</div>

        {canInteract ? (
          <div className="mb-4 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="댓글을 입력하세요"
              maxLength={500}
              className="field flex-1"
            />
            <button onClick={submit} disabled={pending || !text.trim()} className="btn-brand px-4">등록</button>
          </div>
        ) : (
          <p className="mb-4 text-xs text-sub">승인된 회원만 댓글을 쓸 수 있어요.</p>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-sub">첫 댓글을 남겨보세요.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-line/60 pb-3">
                <div className="flex items-center gap-2 text-xs text-sub">
                  <span className="font-bold text-ink">{c.author}</span>
                  <span>{c.createdAt}</span>
                  {c.mine ? (
                    <button
                      onClick={() => start(async () => { await deleteComment(c.id); router.refresh(); })}
                      className="ml-auto text-red-400 hover:underline"
                    >
                      삭제
                    </button>
                  ) : loggedIn ? (
                    <span className="ml-auto">
                      <ContentModeration commentId={c.id} authorId={c.authorId} kind="댓글" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
