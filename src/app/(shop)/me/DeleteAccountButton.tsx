"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "./accountActions";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="mt-8 border-t border-line pt-5">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs text-sub underline hover:text-red-500">
          회원 탈퇴
        </button>
      ) : (
        <div className="rounded-xl2 border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-bold text-red-600">정말 탈퇴하시겠어요?</div>
          <p className="mt-1 text-xs text-ink/70">
            계정과 개인정보(이름·연락처·본인확인·정산정보)가 <b>즉시 삭제</b>되며 복구할 수 없어요.
            (거래·정산 기록은 관련 법령에 따라 익명 보관됩니다.)
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => start(() => deleteMyAccount())}
              disabled={pending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "처리 중…" : "탈퇴하기"}
            </button>
            <button onClick={() => setOpen(false)} className="btn-line px-4 py-2 text-sm">
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
