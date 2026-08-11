"use client";

import { useRef, useState, useTransition } from "react";
import { reserveVisit } from "./actions";

export default function CouponActions({
  couponId,
  cardId,
  mapUrl,
  reserved,
}: {
  couponId: string;
  cardId: string;
  mapUrl: string;
  reserved: { date: string; time: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(reserved ? { ok: true, text: `예약됨 · ${reserved.date} ${reserved.time}` } : null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  async function saveImage() {
    const el = document.getElementById(cardId);
    if (!el) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#2C3A30" });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `via-elite-privilege.png`;
    a.click();
  }

  function submit() {
    const date = dateRef.current?.value ?? "";
    const time = timeRef.current?.value ?? "";
    start(async () => {
      const r = await reserveVisit(couponId, date, time);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setOpen(false);
    });
  }

  return (
    <div className="mt-5">
      <button onClick={() => setOpen((v) => !v)} className="w-full rounded-md bg-gradient-to-b from-[#DCC38A] to-[#B99A5B] py-3 text-sm font-bold text-[#241E10]">
        방문 예약하기
      </button>
      {open && (
        <div className="mt-2 rounded-md border border-[#DCC38A]/40 p-3">
          <div className="flex gap-2">
            <input ref={dateRef} type="date" defaultValue={reserved?.date} className="flex-1 rounded bg-white/10 px-2 py-2 text-sm text-white [color-scheme:dark]" />
            <input ref={timeRef} type="time" defaultValue={reserved?.time ?? "14:00"} className="rounded bg-white/10 px-2 py-2 text-sm text-white [color-scheme:dark]" />
          </div>
          <button onClick={submit} disabled={pending} className="mt-2 w-full rounded bg-[#DCC38A] py-2 text-sm font-bold text-[#241E10] disabled:opacity-50">
            {pending ? "접수 중…" : "예약 접수"}
          </button>
        </div>
      )}
      {msg && <div className={`mt-2 text-center text-xs ${msg.ok ? "text-[#DCC38A]" : "text-red-300"}`}>{msg.text}</div>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={saveImage} className="rounded-md border border-[#DCC38A]/40 py-2.5 text-xs font-semibold text-[#DCC38A]">이미지 저장</button>
        <a href={mapUrl} target="_blank" className="rounded-md border border-[#DCC38A]/40 py-2.5 text-center text-xs font-semibold text-[#DCC38A]">길찾기</a>
      </div>
    </div>
  );
}
