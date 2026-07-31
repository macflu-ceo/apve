"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantVoucherByUsername } from "./actions";

export default function ManualGrant() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [username, setUsername] = useState("");
  const [count, setCount] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function grant() {
    setMsg(null);
    start(async () => {
      const r = await grantVoucherByUsername(username, count);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setUsername("");
        setCount(1);
        router.refresh();
      }
    });
  }

  return (
    <div className="card mb-6 p-4">
      <div className="mb-1 text-sm font-bold">회원에게 20% 바우처 직접 지급</div>
      <p className="mb-2 text-xs text-sub">인증 없이도 특정 회원 아이디로 바로 지급할 수 있어요.</p>
      <div className="flex flex-wrap items-center gap-2">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="회원 아이디" className="field w-48" />
        <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="field w-20" />
        <span className="text-sm text-sub">개</span>
        <button onClick={grant} disabled={pending || !username.trim()} className="btn-brand px-4">지급</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
