"use client";

import { useState } from "react";

/** 상품 상세 이미지 갤러리 — 스와이프/화살표/닷, 깨진 이미지는 자동 숨김 */
export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  const visible = images.filter((u) => u && !broken.has(u));

  if (visible.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl2 bg-[#f5f4f2] text-sub">
        No Image
      </div>
    );
  }

  const cur = Math.min(idx, visible.length - 1);
  const go = (d: number) => setIdx((cur + d + visible.length) % visible.length);

  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-xl2 bg-[#f5f4f2] select-none"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX != null) {
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 40 && visible.length > 1) go(dx < 0 ? 1 : -1);
        }
        setTouchX(null);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visible[cur]}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setBroken((prev) => new Set(prev).add(visible[cur]))}
      />

      {visible.length > 1 && (
        <>
          <button
            type="button"
            aria-label="이전"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-bold text-white">
            {cur + 1}/{visible.length}
          </div>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-1">
            {visible.map((u, i) => (
              <button
                key={u}
                type="button"
                aria-label={`${i + 1}번째 이미지`}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === cur ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
