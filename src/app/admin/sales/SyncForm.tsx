"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncSalesAction } from "./actions";

function daysAgo(n: number) {
  const t = Date.now() + 9 * 3600_000 - n * 86400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export default function SyncForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysAgo(0));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function run() {
    setMsg(null);
    start(async () => {
      const r = await syncSalesAction(from, to);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="card mb-6 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-sub">시작일</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field w-40" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-sub">종료일</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field w-40" />
        </label>
        <button onClick={run} disabled={pending} className="btn-brand h-[42px] px-5">
          {pending ? "가져오는 중…" : "고도몰에서 가져오기"}
        </button>
        <div className="flex gap-1.5 text-xs">
          {[
            { label: "7일", n: 6 },
            { label: "30일", n: 29 },
            { label: "90일", n: 89 },
          ].map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setFrom(daysAgo(q.n));
                setTo(daysAgo(0));
              }}
              className="rounded-full border border-line px-3 py-1 font-semibold text-ink/70 hover:border-ink/30"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
      )}
      <p className="mt-2 text-xs text-sub">
        고도몰 [영업사원 통계] 와 동일 기준입니다. 취소·반품 건은 자동으로 취소 처리되며, 같은 주문은 중복 없이 갱신됩니다.
      </p>
    </div>
  );
}
