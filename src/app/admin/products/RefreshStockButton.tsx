"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshAllStockAction, syncDomesticTags } from "./actions";

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

  function runDomestic() {
    setMsg(null);
    start(async () => {
      const r = await syncDomesticTags();
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={run} disabled={pending} className="btn-line px-4 py-2 text-sm">
        {pending ? "처리 중…" : "↻ 최신화 (재고·가격)"}
      </button>
      <button onClick={runDomestic} disabled={pending} className="btn-line px-4 py-2 text-sm">
        {pending ? "처리 중…" : "🇰🇷 국내배송 동기화"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
    </div>
  );
}
