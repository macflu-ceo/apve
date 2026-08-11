"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyStorePin } from "./actions";

export default function PinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="text-center text-2xl font-black text-ink">매장 스캔</div>
      <p className="mt-1 text-center text-sm text-sub">매장 PIN을 입력하세요.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErr("");
          start(async () => {
            const r = await verifyStorePin(pin);
            if (r.ok) router.refresh();
            else setErr(r.message);
          });
        }}
        className="mt-6 space-y-3"
      >
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          className="field w-full text-center text-lg tracking-widest"
        />
        {err && <div className="text-center text-sm text-red-500">{err}</div>}
        <button disabled={pending} className="btn-primary w-full rounded-lg py-3 font-bold disabled:opacity-50">
          {pending ? "확인 중…" : "입장"}
        </button>
      </form>
    </div>
  );
}
