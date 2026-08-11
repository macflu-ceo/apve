"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveStore } from "./actions";

type Store = { id: string; name: string; code: string; address: string | null; hours: string | null; mapUrl: string | null; hasPin: boolean };

export default function StoreForm({ store }: { store?: Store }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    name: store?.name ?? "",
    code: store?.code ?? "",
    address: store?.address ?? "",
    hours: store?.hours ?? "",
    mapUrl: store?.mapUrl ?? "",
    pin: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveStore(store?.id ?? null, f);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        set("pin", "");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2">
      <label className="block"><span className="text-xs text-sub">매장명</span><input className="field mt-1 w-full" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label className="block"><span className="text-xs text-sub">코드(영문 2자)</span><input className="field mt-1 w-full" value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="cd" maxLength={2} /></label>
      <label className="col-span-2 block"><span className="text-xs text-sub">주소</span><input className="field mt-1 w-full" value={f.address} onChange={(e) => set("address", e.target.value)} /></label>
      <label className="block"><span className="text-xs text-sub">영업시간</span><input className="field mt-1 w-full" value={f.hours} onChange={(e) => set("hours", e.target.value)} placeholder="11:00 – 20:00" /></label>
      <label className="block"><span className="text-xs text-sub">길찾기 URL(선택)</span><input className="field mt-1 w-full" value={f.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} /></label>
      <label className="col-span-2 block">
        <span className="text-xs text-sub">스캔 PIN {store?.hasPin && <span className="text-emerald-600">(설정됨 — 바꿀 때만 입력)</span>}</span>
        <input className="field mt-1 w-full" value={f.pin} onChange={(e) => set("pin", e.target.value)} placeholder={store?.hasPin ? "변경 시에만 입력" : "매장 직원용 PIN"} />
      </label>
      <div className="col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-ink px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "저장 중…" : store ? "수정" : "매장 추가"}</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
