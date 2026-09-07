"use client";

import { useState } from "react";

/**
 * 「정품이 아니면 200% 보상」 자리의 접이식 안내.
 * 크고 까만 박스는 페이지를 눌러버려서, 아이보리 바탕에 골드 헤어라인으로
 * 한 줄만 차지하게 줄였다. 펼치면 이유 다섯 가지가 나온다.
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
    <div className="rounded-xl bg-[#FBF9F3] shadow-[0_2px_10px_rgba(20,30,80,.06)] ring-1 ring-[#D8B26E]/40">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
          <path d="M12 2l7.5 3v6.2c0 4.9-3.2 8.8-7.5 10.3C7.7 20 4.5 16.1 4.5 11.2V5L12 2z" stroke="#B08D4C" strokeWidth="1.5" />
          <path d="M8.7 11.8l2.3 2.3 4.3-4.4" stroke="#B08D4C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="min-w-0 flex-1">
          <span className="text-[12.5px] font-bold text-[#5a4a28]">가품이면 결제금액의 200%를 보상합니다</span>
          <span className="ml-1.5 hidden text-[10.5px] text-[#a08a5e] min-[360px]:inline">· VIA ÉLITE 공식 컨시어지</span>
        </div>
        <svg
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 shrink-0 fill-[#B08D4C]/70 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M10 13.2L3.8 7l1.1-1.1L10 11l5.1-5.1L16.2 7z" />
        </svg>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="mx-3.5 h-px bg-gradient-to-r from-transparent via-[#D8B26E]/40 to-transparent" aria-hidden />
          <ul className="space-y-3 px-3.5 py-3.5">
            {PERKS.map((p, i) => (
              <li key={p.title} className="flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-[10px] font-bold tabular-nums tracking-widest text-[#B08D4C]/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#4a3d21]">{p.title}</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-[#7d6c4a]">{p.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
