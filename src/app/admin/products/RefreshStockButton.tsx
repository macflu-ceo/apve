"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshAllStockAction } from "./actions";

export default function RefreshStockButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function run() {
    setMsg(null);
    start(async () => {
      const r = await refreshAllStockAction();
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={pending} className="btn-line px-4 py-2 text-sm">
        {pending ? "재고 갱신 중…" : "↻ 재고 새로고침"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
    </div>
  );
}
