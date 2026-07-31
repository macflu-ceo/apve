"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setHidden, setPinned, grantRewardForPost } from "./actions";

export type Row = {
  id: string;
  category: string;
  title: string;
  author: string;
  hidden: boolean;
  pinned: boolean;
  rewarded: boolean;
  hasImage: boolean;
  createdAt: string;
};

export default function CommunityRow({ p }: { p: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.message);
      router.refresh();
    });
  }

  return (
    <tr className={`border-t border-line align-top ${p.hidden ? "opacity-50" : ""}`}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {p.pinned && <span className="text-brand">📌</span>}
          <span className="rounded bg-brandsoft px-1.5 py-0.5 text-[10px] font-bold text-brand">
            {p.category === "review" ? "리뷰인증" : p.category === "promo" ? "홍보인증" : "판매노하우"}
          </span>
          {p.hasImage && <span className="text-xs text-sub">🖼</span>}
        </div>
        <a href={`/community/${p.id}`} target="_blank" className="mt-1 block font-medium hover:text-brand">{p.title}</a>
        <div className="text-xs text-sub">{p.author} · {p.createdAt}</div>
        {msg && <div className="mt-1 text-xs text-green-700">{msg}</div>}
      </td>
      <td className="px-3 py-2 text-center">
        {p.rewarded ? (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">지급완료</span>
        ) : (
          <button
            disabled={pending}
            onClick={() => run(() => grantRewardForPost(p.id))}
            className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            20% 바우처 지급
          </button>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
        <button disabled={pending} onClick={() => run(() => setPinned(p.id, !p.pinned))} className="text-ink/60 hover:text-ink">
          {p.pinned ? "고정해제" : "고정"}
        </button>
        <span className="mx-1 text-line">|</span>
        <button disabled={pending} onClick={() => run(() => setHidden(p.id, !p.hidden))} className="text-ink/60 hover:text-ink">
          {p.hidden ? "노출" : "숨김"}
        </button>
      </td>
    </tr>
  );
}
