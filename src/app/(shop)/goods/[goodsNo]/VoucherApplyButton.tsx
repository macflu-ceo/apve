"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyProductVoucher, unapplyProductVoucher } from "./actions";

/**
 * 20% 바우처 적용 버튼.
 *  · appliedHere="used"   → 이미 이 상품 최초 판매에 20% 적용 완료 (배지)
 *  · appliedHere="applied"→ 적용중(판매 대기) · 취소 가능
 *  · available>0          → 적용 버튼
 *  · 그 외                → 렌더 안 함
 */
export default function VoucherApplyButton({
  goodsNo,
  available,
  appliedHere,
}: {
  goodsNo: string;
  available: number;
  appliedHere: "applied" | "used" | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (appliedHere === "used") {
    return (
      <div className="mt-3 rounded-xl2 bg-amber-50 p-3 text-center text-sm font-bold text-amber-700 ring-1 ring-amber-200">
        ✅ 이 상품에 20% 바우처가 적용되어 최초 판매 1건에 20%가 반영됐어요.
      </div>
    );
  }

  function apply() {
    setMsg(null);
    start(async () => {
      const r = await applyProductVoucher(goodsNo);
      setMsg(r.message);
      if (r.ok) router.refresh();
    });
  }
  function cancel() {
    setMsg(null);
    start(async () => {
      const r = await unapplyProductVoucher(goodsNo);
      setMsg(r.message);
      if (r.ok) router.refresh();
    });
  }

  if (appliedHere === "applied") {
    return (
      <div className="mt-3 rounded-xl2 bg-amber-50 p-3 ring-1 ring-amber-200">
        <div className="text-sm font-bold text-amber-700">⏳ 20% 바우처 적용 중</div>
        <div className="mt-0.5 text-xs text-amber-700/80">이 상품이 처음 팔리면 그 1건에 20%가 적용돼요.</div>
        <button onClick={cancel} disabled={pending} className="mt-2 text-xs text-amber-700 underline disabled:opacity-50">
          적용 취소
        </button>
        {msg && <p className="mt-1 text-xs text-amber-700">{msg}</p>}
      </div>
    );
  }

  if (available <= 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={apply}
        disabled={pending}
        className="w-full rounded-xl2 border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
      >
        ⭐ 이 상품에 20% 바우처 적용 (보유 {available}개)
      </button>
      <p className="mt-1 text-center text-[11px] text-sub">최초 판매 1건 수수료가 20%로 올라갑니다.</p>
      {msg && <p className="mt-1 text-center text-xs text-red-600">{msg}</p>}
    </div>
  );
}
