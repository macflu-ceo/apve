"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePartner, rejectPartner } from "./actions";

type P = { id: string; username: string; name: string; phone: string | null; verified: boolean; createdAt: string };

export default function PendingRow({ p }: { p: P }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function approve() {
    start(async () => {
      const r = await approvePartner(p.id, code);
      setMsg(r.message);
      if (r.ok) router.refresh();
    });
  }
  function reject() {
    if (!confirm("반려할까요?")) return;
    start(async () => { await rejectPartner(p.id); router.refresh(); });
  }

  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-[160px] flex-1">
        <div className="text-sm font-bold">
          {p.name} <span className="text-sub">@{p.username}</span>
        </div>
        <div className="text-xs text-sub">
          {p.phone ?? "-"} · {p.verified ? "본인인증 완료" : "미인증"} · {p.createdAt}
        </div>
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="고도몰 코드 (예: ic001ws)"
        className="w-44 rounded-md border border-line px-3 py-2 text-sm"
      />
      <button onClick={approve} disabled={pending || !code} className="btn-brand px-4 py-2 text-xs disabled:opacity-40">
        승인
      </button>
      <button onClick={reject} disabled={pending} className="text-xs text-red-500 hover:underline">
        반려
      </button>
      {msg && <span className="w-full text-xs text-red-600">{msg}</span>}
    </div>
  );
}
