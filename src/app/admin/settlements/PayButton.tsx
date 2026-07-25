"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPartnerPaid, revertPayout } from "./actions";

export function PayButton({ partnerId, net }: { partnerId: string; net: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run() {
    if (!confirm(`실지급액 ${net.toLocaleString()}원(원천징수 후)을 지급 완료로 처리할까요?\n실제 계좌이체는 별도로 진행하세요.`)) return;
    start(async () => {
      await markPartnerPaid(partnerId);
      router.refresh();
    });
  }

  return (
    <button onClick={run} disabled={pending} className="btn-brand px-3 py-1.5 text-xs">
      {pending ? "처리 중…" : "지급 완료 처리"}
    </button>
  );
}

export function RevertButton({ partnerId, paidOutAt }: { partnerId: string; paidOutAt: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run() {
    if (!confirm("이 지급 처리를 되돌릴까요? (다시 미정산 상태가 됩니다)")) return;
    start(async () => {
      await revertPayout(partnerId, paidOutAt);
      router.refresh();
    });
  }

  return (
    <button onClick={run} disabled={pending} className="text-xs text-red-500 hover:underline">
      {pending ? "…" : "되돌리기"}
    </button>
  );
}
