"use client";

import { useEffect, useState } from "react";

/**
 * 공식 컨시어지 뱃지 + 인증서.
 *
 * 처음 온 사람은 이 페이지가 개인이 만든 것인지 회사가 인증한 것인지 알 수 없다.
 * 뱃지는 골드로 다른 칩들과 확실히 구분하고, › 표시로 눌리는 것임을 알린다.
 * 눌렀을 때는 가벼운 안내 팝업이 아니라 '인증서' 한 장으로 보여준다.
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold text-[#2b2410] shadow-[0_2px_10px_rgba(0,0,0,.25)] ring-1 ring-white/40 transition active:scale-95"
        style={{ background: "linear-gradient(135deg,#F3DFAE 0%,#D8B26E 55%,#C39B55 100%)" }}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 fill-current" aria-hidden>
          <path d="M7 .8l4.6 1.9v4c0 3-2 5.4-4.6 6.5C4.4 12.1 2.4 9.7 2.4 6.7v-4L7 .8zm2.5 4.4L6.3 8.4 4.6 6.7l-.9.9 2.6 2.6 4.1-4.1-.9-.9z" />
        </svg>
        공식 인증 컨시어지
        <span aria-hidden className="text-[12px] leading-none opacity-70">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
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
        </div>
      )}
    </>
  );
}
