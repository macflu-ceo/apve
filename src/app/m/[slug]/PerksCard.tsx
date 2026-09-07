"use client";

import { useState } from "react";

/**
 * 「정품이 아니면 200% 보상」 한 줄만 있던 자리.
 * 공식 컨시어지 샵에서 사야 하는 이유를 인증서 톤(다크·골드)으로 펼쳐 보여준다.
 */
const PERKS = [
  {
    title: "가품 판정 시 200% 보상",
    desc: "공인 감정기관에서 가품으로 판정되면 결제하신 금액의 200%를 보상합니다. 반품이 아니라 보상입니다.",
  },
  {
    title: "수입신고필증 100% 매칭 · 요청 시 발급",
    desc: "모든 상품은 정식 통관된 상품입니다. 품명·규격·통관일자를 그대로 확인하실 수 있습니다.",
  },
  {
    title: "이탈리아 부티크 직계약",
    desc: "현지 부티크에서 바로 들어오는 물량입니다. 유통 단계가 짧아 백화점가보다 낮은 가격으로 제안드립니다.",
  },
  {
    title: "원하는 상품 개인 소싱",
    desc: "리스트에 없는 모델도 컨시어지가 현지에 직접 문의해 찾아드립니다.",
  },
  {
    title: "외부 감정기관 감정 접수 지원",
    desc: "직접 감정을 받아보고 싶으시면 감정기관 접수를 도와드립니다. 제3자의 판단으로 확인하십시오.",
  },
];

export default function PerksCard() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl p-[1.2px] shadow-[0_8px_28px_rgba(10,12,24,.35)]"
      style={{ background: "linear-gradient(150deg,rgba(243,223,174,.85),rgba(138,111,62,.45) 45%,rgba(243,223,174,.55))" }}
    >
      <div className="overflow-hidden rounded-[15px] bg-[#14151b] text-white">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3.5 p-4 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D8B26E]/45">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M12 2l7.5 3v6.2c0 4.9-3.2 8.8-7.5 10.3C7.7 20 4.5 16.1 4.5 11.2V5L12 2z" stroke="#D8B26E" strokeWidth="1.3" />
              <path d="M8.7 11.8l2.3 2.3 4.3-4.4" stroke="#D8B26E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold tracking-[0.3em] text-[#D8B26E]/85">VIA ÉLITE OFFICIAL CONCIERGE SHOP</div>
            <div className="mt-1 text-[14px] font-extrabold leading-snug">가품이면 결제금액의 200%를 보상합니다</div>
            <div className="mt-0.5 truncate text-[11px] text-white/45">수입신고필증 · 감정 지원 · 부티크 직계약</div>
          </div>
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 fill-[#D8B26E]/80 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M10 13.2L3.8 7l1.1-1.1L10 11l5.1-5.1L16.2 7z" />
          </svg>
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#D8B26E]/35 to-transparent" aria-hidden />
            <ul className="space-y-4 px-4 py-4">
              {PERKS.map((p, i) => (
                <li key={p.title} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[11px] font-bold tabular-nums tracking-widest text-[#D8B26E]/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#F3DFAE]">{p.title}</div>
                    <div className="mt-1 text-[11.5px] leading-relaxed text-white/55">{p.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 pb-4 text-center text-[9px] tracking-[0.28em] text-white/30">AUTHENTICITY GUARANTEED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
