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
        placeholder="고도몰 아이디 (예: cd001ws)"
        className="w-44 rounded-md border border-line px-3 py-2 text-sm"
      />
      <button onClick={approve} disabled={pending || !code} className="btn-brand px-4 py-2 text-xs disabled:opacity-40">
        승인
      </button>
      <button onClick={reject} disabled={pending} className="text-xs text-red-500 hover:underline">
        반려
      </button>
      <p className="w-full text-[11px] leading-relaxed text-sub">
        ⚠️ 코드는 <b>고도몰에서 발급한 영업사원 아이디와 반드시 동일</b>하게 입력하세요. 이 값으로 판매 실적이 매칭됩니다.
        (고도몰에 해당 아이디가 <b>영업사원</b>으로 등록돼 있어야 합니다.)
      </p>
      {msg && <span className="w-full text-xs text-red-600">{msg}</span>}
    </div>
  );
}
