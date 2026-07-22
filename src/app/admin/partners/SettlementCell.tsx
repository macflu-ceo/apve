"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifySettlement } from "./actions";

export default function SettlementCell({
  partnerId,
  status,
  residentMasked,
  address,
  bank,
  accountMasked,
  holder,
  idCardPath,
  bankbookPath,
}: {
  partnerId: string;
  status: string;
  residentMasked: string;
  address: string | null;
  bank: string | null;
  accountMasked: string;
  holder: string | null;
  idCardPath: string | null;
  bankbookPath: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  if (status === "none") return <span className="text-xs text-sub">미제출</span>;

  return (
    <div className="text-xs">
      <button onClick={() => setOpen(!open)} className="text-brand underline">
        {status === "verified" ? "확인완료 ✓" : "제출됨"}
      </button>

      {open && (
        <div className="mt-2 space-y-1 rounded-lg border border-line bg-[#fafafa] p-2">
          <div>주민번호: <b>{residentMasked}</b></div>
          <div>주소: {address ?? "-"}</div>
          <div>계좌: {bank ?? "-"} {accountMasked} ({holder ?? "-"})</div>
          <div className="flex gap-2 pt-1">
            {idCardPath && (
              <a href={`/api/admin/docs?path=${encodeURIComponent(idCardPath)}`} target="_blank" className="text-brand underline">
                신분증 보기
              </a>
            )}
            {bankbookPath && (
              <a href={`/api/admin/docs?path=${encodeURIComponent(bankbookPath)}`} target="_blank" className="text-brand underline">
                통장 보기
              </a>
            )}
          </div>
          <button
            onClick={() => start(async () => { await verifySettlement(partnerId, status !== "verified"); router.refresh(); })}
            disabled={pending}
            className={`mt-1 rounded-full px-2 py-0.5 font-bold ${status === "verified" ? "bg-line text-sub" : "bg-deal/15 text-deal"}`}
          >
            {status === "verified" ? "확인 취소" : "확인 완료 처리"}
          </button>
        </div>
      )}
    </div>
  );
}
