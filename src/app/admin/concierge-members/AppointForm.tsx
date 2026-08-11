"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { appointConcierge, revokeConcierge } from "./actions";

export function AppointForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await appointConcierge(username);
          setMsg({ ok: r.ok, text: r.message });
          if (r.ok) {
            setUsername("");
            router.refresh();
          }
        });
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div>
        <label className="text-xs text-sub">회원 아이디</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="예: kim001" className="field mt-1 w-48" />
      </div>
      <button disabled={pending} className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "처리 중…" : "컨시어지 임명"}
      </button>
      {msg && <span className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</span>}
    </form>
  );
}

export function RevokeButton({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("이 컨시어지를 해제할까요?")) return;
        start(async () => {
          await revokeConcierge(partnerId);
          router.refresh();
        });
      }}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      해제
    </button>
  );
}
