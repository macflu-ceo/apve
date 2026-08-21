"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePostPublished, togglePostPinned, deletePost } from "./actions";

type P = { id: string; category: string; title: string; pinned: boolean; published: boolean; createdAt: string; hasVideo: boolean };

export default function PostRow({ p }: { p: P }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="rounded bg-brandsoft px-2 py-0.5 text-xs font-bold text-brand">{p.category}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {p.pinned && <span className="mr-1 text-brand">📌</span>}
          {p.hasVideo && <span className="mr-1">🎬</span>}
          {p.title}
        </div>
        <div className="text-xs text-sub">{p.createdAt}</div>
      </div>
      <button
        onClick={() => start(async () => { await togglePostPinned(p.id, !p.pinned); router.refresh(); })}
        disabled={pending}
        className={`rounded-full px-3 py-1 text-xs font-bold ${p.pinned ? "bg-brand text-white" : "bg-line text-sub"}`}
        title="공지 목록 상단에 고정"
      >
        {p.pinned ? "📌 고정중" : "고정"}
      </button>
      <button
        onClick={() => start(async () => { await togglePostPublished(p.id, !p.published); router.refresh(); })}
        disabled={pending}
        className={`rounded-full px-3 py-1 text-xs font-bold ${p.published ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
      >
        {p.published ? "게시중" : "비공개"}
      </button>
      <Link href={`/admin/posts/${p.id}`} className="btn-line px-3 py-2 text-xs">수정</Link>
      <button
        onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deletePost(p.id); router.refresh(); }); }}
        disabled={pending}
        className="text-xs text-red-500 hover:underline"
      >
        삭제
      </button>
    </div>
  );
}
