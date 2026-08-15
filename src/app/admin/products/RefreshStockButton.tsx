"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { listRefreshTargets, refreshImportBatch, finishRefreshAction, syncDomesticTags } from "./actions";

const BATCH = 6; // 서버 시간제한 안 걸리게 6개씩

export default function RefreshStockButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const stopRef = useRef(false);

  async function runFull() {
    if (!confirm("전체 상품을 몰 데이터로 다시 가져옵니다 (가격·재고·이미지·상세 갱신).\n몇 분 걸릴 수 있어요. 진행할까요?")) return;
    setMsg(null);
    setRunning(true);
    stopRef.current = false;
    try {
      const t = await listRefreshTargets();
      if (!t.ok || t.goodsNos.length === 0) {
        setMsg({ ok: false, text: "대상 상품이 없습니다." });
        return;
      }
      const total = t.goodsNos.length;
      let done = 0;
      let updated = 0;
      const errors: string[] = [];
      for (let i = 0; i < total; i += BATCH) {
        if (stopRef.current) break;
        const slice = t.goodsNos.slice(i, i + BATCH);
        try {
          const r = await refreshImportBatch(slice);
          updated += r.updated;
          errors.push(...(r.errors ?? []));
        } catch {
          errors.push(...slice.map((g) => `${g}: 요청 실패`));
        }
        done = Math.min(total, i + BATCH);
        setProgress(`최신화 중… ${done}/${total}`);
      }
      const fin = await finishRefreshAction();
      const parts = [`갱신 ${updated}개`];
      if (errors.length > 0) parts.push(`실패 ${errors.length}개`);
      if (fin.ok && fin.message) parts.push(fin.message);
      if (stopRef.current) parts.push("(중단됨)");
      setMsg({ ok: errors.length < total, text: parts.join(" · ") });
      router.refresh();
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  function runDomestic() {
    setMsg(null);
    start(async () => {
      const r = await syncDomesticTags();
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  const busy = running || pending;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={runFull} disabled={busy} className="btn-line px-4 py-2 text-sm">
        {running ? (progress ?? "최신화 중…") : "↻ 전체 최신화 (가격·재고)"}
      </button>
      {running && (
        <button onClick={() => { stopRef.current = true; }} className="text-xs text-red-500 underline">
          중단
        </button>
      )}
      <button onClick={runDomestic} disabled={busy} className="btn-line px-4 py-2 text-sm">
        {pending ? "처리 중…" : "🇰🇷 국내배송 동기화"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
    </div>
  );
}
