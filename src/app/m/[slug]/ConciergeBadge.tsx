"use client";

import { useState } from "react";

/**
 * 공식 컨시어지 뱃지.
 *
 * 처음 온 사람은 이 페이지가 개인이 만든 것인지 회사가 인증한 것인지 알 수 없다.
 * 눌러서 확인할 수 있게 두되, 설명은 한 문장이면 충분하다.
 */
export default function ConciergeBadge({ no }: { no: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold backdrop-blur transition hover:bg-white/30"
      >
        <svg viewBox="0 0 14 14" className="h-3 w-3 fill-current" aria-hidden>
          <path d="M7 .8l4.6 1.9v4c0 3-2 5.4-4.6 6.5C4.4 12.1 2.4 9.7 2.4 6.7v-4L7 .8zm2.5 4.4L6.3 8.4 4.6 6.7l-.9.9 2.6 2.6 4.1-4.1-.9-.9z" />
        </svg>
        공식 컨시어지
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 text-center text-ink shadow-xl sm:rounded-2xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brandsoft text-2xl">
              🛡️
            </div>
            <div className="mt-3 text-lg font-bold">인증된 컨시어지입니다</div>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              비아엘리떼가 직접 심사해 임명한 공식 컨시어지입니다.
              <br />
              컨시어지 번호 <b className="text-brand">{no}</b>
            </p>
            <button onClick={() => setOpen(false)} className="btn-brand mt-5 w-full">
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
