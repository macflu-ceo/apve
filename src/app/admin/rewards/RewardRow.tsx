"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReward, rejectReward } from "./actions";

export type Row = {
  id: string;
  type: string;
  author: string;
  content: string;
  images: string[];
  status: string;
  createdAt: string;
};

const STATUS: Record<string, { t: string; c: string }> = {
  pending: { t: "검토중", c: "bg-amber-100 text-amber-700" },
  approved: { t: "승인", c: "bg-emerald-100 text-emerald-700" },
  rejected: { t: "반려", c: "bg-line text-sub" },
};

export default function RewardRow({ r }: { r: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      setMsg(res.message);
      router.refresh();
    });
  }

  const st = STATUS[r.status] ?? { t: r.status, c: "bg-line text-sub" };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-brandsoft px-1.5 py-0.5 text-[10px] font-bold text-brand">
          {r.type === "review" ? "리뷰인증" : "홍보인증"}
        </span>
        <span className="text-sm font-medium">{r.author}</span>
        <span className="text-xs text-sub">{r.createdAt}</span>
        <span className={`ml-auto rounded px-2 py-0.5 text-xs font-bold ${st.c}`}>{st.t}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{r.content}</p>
      {r.images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {r.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={i} href={src} target="_blank">
              <img src={src} alt="" className="h-24 w-24 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
      {r.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => run(() => approveReward(r.id))} disabled={pending} className="btn-brand px-4 py-1.5 text-sm">
            승인 + 20% 지급
          </button>
          <button onClick={() => run(() => rejectReward(r.id))} disabled={pending} className="btn-line px-4 py-1.5 text-sm">
            반려
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-green-700">{msg}</p>}
    </div>
  );
}
