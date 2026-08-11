"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lookupCoupon, markCouponUsed, storeLogout } from "./actions";

type Coupon = {
  id: string; code: string; customerName: string; phoneLast4: string;
  benefitText: string; brandsText: string | null; conciergeName: string;
  priceType: string; storeName: string; endAt: string; state: string;
};

const STATE: Record<string, { t: string; c: string }> = {
  valid: { t: "사용 가능", c: "bg-emerald-100 text-emerald-700" },
  used: { t: "사용 완료", c: "bg-red-100 text-red-600" },
  expired: { t: "만료", c: "bg-red-100 text-red-600" },
  canceled: { t: "취소됨", c: "bg-line text-sub" },
};

export default function ScanConsole({ initial }: { initial: Coupon | null }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(initial);
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function find() {
    if (!code.trim()) return;
    start(async () => {
      const r = await lookupCoupon(code);
      setMsg(r.ok ? null : { ok: false, text: r.message });
      setCoupon(r.ok ? r.coupon : null);
    });
  }

  function use() {
    if (!coupon) return;
    if (!confirm(`${coupon.customerName}님 권한을 사용 처리할까요?`)) return;
    start(async () => {
      const r = await markCouponUsed(coupon.id, amount ? Number(amount) : undefined);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setCoupon({ ...coupon, state: "used" });
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black">매장 스캔 · 사용 처리</h1>
        <button onClick={() => start(async () => { await storeLogout(); router.refresh(); })} className="text-xs text-sub hover:underline">종료</button>
      </div>

      <div className="card p-4">
        <div className="text-xs text-sub">코드 직접 입력 (QR 스캔이 안 될 때)</div>
        <div className="mt-1 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && find()} placeholder="cd001cp-0731" className="field flex-1" />
          <button onClick={find} className="rounded-lg bg-ink px-4 text-sm font-bold text-white">조회</button>
        </div>
        {msg && !msg.ok && <div className="mt-2 text-sm text-red-500">{msg.text}</div>}
      </div>

      {coupon && (
        <div className="card mt-4 p-5">
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-bold ${STATE[coupon.state].c}`}>{STATE[coupon.state].t}</span>
            <span className="text-lg font-bold">{coupon.customerName} 님</span>
          </div>
          <div className="mt-1 text-sm text-sub">연락처 끝자리 <b className="text-ink">****{coupon.phoneLast4}</b> · 본인 확인</div>
          <div className="mt-3 rounded-xl2 bg-brandsoft p-3 text-sm">
            <div className="font-bold">{coupon.benefitText}</div>
            {coupon.brandsText && <div className="mt-0.5 text-xs text-ink/70">{coupon.brandsText}</div>}
            <div className="mt-1.5 text-xs text-sub">
              <code>{coupon.code}</code> · {coupon.conciergeName} · ~{coupon.endAt} · {coupon.priceType}
            </div>
          </div>

          {coupon.state === "valid" ? (
            <div className="mt-4">
              <label className="text-xs text-sub">구매 금액 (선택 · 집계용)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="원" className="field mt-1 w-full" />
              <button onClick={use} disabled={pending} className="mt-3 w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {pending ? "처리 중…" : "사용 처리"}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-red-50 py-3 text-center text-sm font-bold text-red-600">
              {msg?.text ?? (coupon.state === "used" ? "이미 사용된 권한입니다." : coupon.state === "expired" ? "유효 기간이 지났습니다." : "사용할 수 없습니다.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
