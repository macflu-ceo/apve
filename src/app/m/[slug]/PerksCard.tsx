"use client";

import { useState } from "react";

/**
 * 「정품이 아니면 200% 보상」 한 줄만 있던 자리.
 * 정품 보증은 여러 이유 중 하나일 뿐이라, 펼쳐서 나머지도 읽을 수 있게 바꿨다.
 */
const PERKS = [
  { icon: "🛡️", title: "100% 정품 보증", desc: "정품이 아니면 200% 보상해 드립니다." },
  { icon: "🇮🇹", title: "이탈리아 부티크 직계약", desc: "현지 부티크에서 바로 들어오는 물량이라 유통 단계가 짧습니다." },
  { icon: "🔖", title: "백화점가보다 낮은 가격", desc: "중간 유통 마진을 덜어낸 가격으로 제안드립니다." },
  { icon: "🔎", title: "원하는 상품 개인 소싱", desc: "리스트에 없는 모델도 컨시어지가 현지에 직접 문의합니다." },
  { icon: "📦", title: "국내 배송 · 교환 환불", desc: "정식 채널로 받고, 문제가 있으면 컨시어지가 끝까지 처리합니다." },
];

export default function PerksCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white shadow-[0_6px_24px_rgba(20,30,80,.1)]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brandsoft text-xl">🛡️</div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-extrabold text-gray-900">공식 컨시어지에서 사면 좋은점</div>
          <div className="text-[11.5px] text-gray-500">정품 보증 · 부티크 직계약 · 개인 소싱</div>
        </div>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 fill-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M10 13.2L3.8 7l1.1-1.1L10 11l5.1-5.1L16.2 7z" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-3 border-t border-gray-100 px-4 py-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-2.5">
                <span className="mt-0.5 text-base leading-none">{p.icon}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-gray-900">{p.title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-gray-500">{p.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
