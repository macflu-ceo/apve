"use client";

// 정산정보 제출 회원 승인 행 — 계좌 확인 후 승인하면 회원 마이페이지에 '정산 승인' 표시
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifySettlement } from "./actions";

export default function SettlementApproveRow({
  p,
}: {
  p: {
    id: string;
    name: string;
    username: string;
    bankName: string | null;
    bankAccount: string | null;
    accountHolder: string | null;
    submittedAt: string;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">
          {p.name} <span className="font-normal text-sub">@{p.username}</span>
        </div>
        <div className="mt-0.5 text-xs text-sub">
          {p.bankName ?? "-"} {p.bankAccount ?? ""} (예금주 {p.accountHolder ?? "-"}) · 제출 {p.submittedAt}
        </div>
      </div>
      <button
        onClick={() => start(async () => { await verifySettlement(p.id, true); router.refresh(); })}
        disabled={pending}
        className="btn-brand px-4 py-2 text-sm"
      >
        {pending ? "처리 중…" : "✓ 정산 승인"}
      </button>
    </div>
  );
}
