"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 공식 컨시어지 인증 마크 + 인증서.
 *
 * 인스타 블루체크처럼 프로필 사진 오른쪽 아래에 마크로만 붙는다.
 * 은은하게 커졌다 작아지는 펄스로 시선을 끌고, 누르면 인증서가 뜬다.
 */
const GOLD = "#D8B26E";

export default function ConciergeBadge({ no, name }: { no: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // 등장 트랜지션용

  useEffect(() => {
    if (open) requestAnimationFrame(() => setShown(true));
    else setShown(false);
  }, [open]);

  return (
    <>
      <style>{`
        @keyframes vebadge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.14); } }
        @media (prefers-reduced-motion: reduce) { .vebadge-pulse { animation: none !important; } }
      `}</style>
      <button
        onClick={() => setOpen(true)}
        aria-label="공식 인증 컨시어지"
        aria-haspopup="dialog"
        className="vebadge-pulse absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white shadow-[0_2px_8px_rgba(0,0,0,.35)]"
        style={{
          background: "linear-gradient(135deg,#F3DFAE 0%,#D8B26E 55%,#C39B55 100%)",
          animation: "vebadge-pulse 2.4s ease-in-out infinite",
        }}
      >
        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-[#2b2410]" aria-hidden>
          <path d="M7 .8l4.6 1.9v4c0 3-2 5.4-4.6 6.5C4.4 12.1 2.4 9.7 2.4 6.7v-4L7 .8zm2.5 4.4L6.3 8.4 4.6 6.7l-.9.9 2.6 2.6 4.1-4.1-.9-.9z" />
        </svg>
      </button>

      {/* 헤더 스태킹 컨텍스트에 갇히지 않게 body로 포털 — 아래 요소에 가려지는 문제 방지 */}
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* 인증서 */}
          <div
            role="dialog"
            aria-modal="true"
            className={`relative w-full max-w-[340px] rounded-2xl p-[1.5px] transition-all duration-300 ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}
            style={{ background: "linear-gradient(160deg,#F3DFAE,#8a6f3e 45%,#F3DFAE)" }}
          >
            <div className="rounded-[15px] bg-[#14151b] px-6 pb-6 pt-7 text-center text-white">
              {/* 이중 골드 라인 */}
              <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-[#D8B26E]/25" aria-hidden />

              <div className="text-[9px] font-bold tracking-[0.42em] text-[#D8B26E]/80">CERTIFICATE</div>
              <div className="mt-3 flex items-center justify-center gap-2.5">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D8B26E]/60" aria-hidden />
                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden>
                  <path
                    d="M12 2l7.5 3v6.2c0 4.9-3.2 8.8-7.5 10.3C7.7 20 4.5 16.1 4.5 11.2V5L12 2z"
                    stroke={GOLD}
                    strokeWidth="1.3"
                  />
                  <path d="M8.7 11.8l2.3 2.3 4.3-4.4" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#D8B26E]/60" aria-hidden />
              </div>

              <div className="mt-4 text-[11px] font-bold tracking-[0.3em] text-white/55">VIA ÉLITE</div>
              <div className="mt-1.5 text-[19px] font-extrabold tracking-tight text-[#F3DFAE]">공식 컨시어지 인증서</div>

              {name && <div className="mt-4 text-[16px] font-bold">{name}</div>}
              <div className="mt-1 text-[11px] tracking-[0.14em] text-[#D8B26E]">CONCIERGE NO. {no}</div>

              <p className="mx-auto mt-4 max-w-[240px] text-[12px] leading-relaxed text-white/60">
                비아엘리떼가 직접 심사하여 임명한 공식 컨시어지임을 인증합니다. 모든 상품은 본사가 정품을 보증합니다.
              </p>

              <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#D8B26E]/50 to-transparent" aria-hidden />
              <div className="mt-3 text-[9px] tracking-[0.32em] text-white/35">ITALY DIRECT · SINCE 2016</div>

              <button
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-xl py-3 text-sm font-extrabold text-[#2b2410] transition active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#F3DFAE,#D8B26E)" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
