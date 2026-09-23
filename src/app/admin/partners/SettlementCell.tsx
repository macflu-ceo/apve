"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifySettlement, rejectSettlement } from "./actions";

/** 서류 1건 — 썸네일이 곧 버튼. 클릭하면 원본이 새 탭에서 열린다. */
function DocThumb({ label, path }: { label: string; path: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!path) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-line text-[11px] text-sub">
        {label} 없음
      </div>
    );
  }
  const src = `/api/admin/docs?path=${encodeURIComponent(path)}`;
  return (
    <div className="w-24">
      <a href={src} target="_blank" rel="noreferrer" className="block">
        {broken ? (
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-line bg-white text-[11px] text-sub">
            <span>미리보기 실패</span>
            <span className="text-brand underline">새 탭에서 열기</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            onError={() => setBroken(true)}
            className="h-24 w-24 rounded-lg border border-line object-cover"
          />
        )}
      </a>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[11px] font-bold">{label}</span>
        <a href={`${src}&download=1`} className="text-[11px] text-sub underline" download>
          원본
        </a>
      </div>
    </div>
  );
}

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
  rejectReason,
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
  rejectReason?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // 서류를 보지 않고 승인하는 사고를 막으려고 제출 건은 기본으로 펼쳐 둔다
  const [open, setOpen] = useState(status === "submitted");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (status === "none") return <span className="text-xs text-sub">미제출</span>;

  const badge =
    status === "verified"
      ? { text: "확인완료 ✓", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
      : status === "rejected"
        ? { text: "반려됨", cls: "bg-red-50 text-red-600 ring-red-200" }
        : { text: "확인 대기", cls: "bg-amber-50 text-amber-700 ring-amber-200" };

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-full px-2 py-0.5 font-bold ring-1 ${badge.cls}`}
      >
        {badge.text} {open ? "▲" : "▼"}
      </button>

      {status === "rejected" && rejectReason && (
        <div className="mt-1 text-[11px] text-red-600">사유: {rejectReason}</div>
      )}

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-line bg-[#fafafa] p-2">
          {/* 서류를 먼저 보여준다 — 승인 버튼보다 위 */}
          <div className="flex gap-2">
            <DocThumb label="신분증" path={idCardPath} />
            <DocThumb label="통장" path={bankbookPath} />
          </div>

          <div className="space-y-0.5 border-t border-line pt-2">
            <div>주민번호: <b>{residentMasked}</b></div>
            <div>주소: {address ?? "-"}</div>
            <div>계좌: {bank ?? "-"} {accountMasked} ({holder ?? "-"})</div>
          </div>

          {rejecting ? (
            <div className="space-y-1 border-t border-line pt-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="반려 사유 (회원에게 그대로 보입니다) 예: 신분증 사진이 흐려 식별이 어렵습니다. 다시 올려주세요."
                className="w-full rounded border border-line p-1.5 text-[11px] text-ink"
              />
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    start(async () => {
                      const r = await rejectSettlement(partnerId, reason);
                      if (!r.ok) { alert(r.message); return; }
                      setRejecting(false); setReason(""); router.refresh();
                    })
                  }
                  disabled={pending}
                  className="rounded-full bg-red-600 px-2 py-0.5 font-bold text-white"
                >
                  반려하고 재등록 요청
                </button>
                <button onClick={() => setRejecting(false)} className="rounded-full bg-line px-2 py-0.5">
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1 border-t border-line pt-2">
              <button
                onClick={() => start(async () => { await verifySettlement(partnerId, status !== "verified"); router.refresh(); })}
                disabled={pending}
                className={`rounded-full px-2 py-0.5 font-bold ${status === "verified" ? "bg-line text-sub" : "bg-deal/15 text-deal"}`}
              >
                {status === "verified" ? "확인 취소" : "확인 완료 처리"}
              </button>
              <button
                onClick={() => setRejecting(true)}
                disabled={pending}
                className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-600 ring-1 ring-red-200"
              >
                반려
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
