"use client";

import { useState } from "react";

/**
 * 상품 상세 이미지 갤러리 — 큰 이미지(스와이프/화살표/닷) + 아래 썸네일 미리보기.
 * 로딩에 실패한(액박) 이미지는 큰 화면·썸네일 모두에서 자동으로 사라진다.
 */
export default function ProductGallery({
  images,
  alt,
  tags = [],
}: {
  images: string[];
  alt: string;
  tags?: string[];
}) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  const visible = images.filter((u) => u && !broken.has(u));
  const markBroken = (u: string) => setBroken((prev) => new Set(prev).add(u));

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
    <div>
      {/* 큰 이미지 */}
      {/* w-full + 이미지 absolute: 원본 이미지가 커도 박스가 화면 밖으로 커지지 않게 고정 */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl2 bg-[#f5f4f2] select-none"
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
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => markBroken(visible[cur])}
        />

        {tags.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1">
            {tags.map((t, i) => (
              <span key={i} className="rounded-[4px] bg-ink/85 px-2 py-1 text-xs font-bold text-white">
                {t}
              </span>
            ))}
          </div>
        )}

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
          </>
        )}
      </div>

      {/* 썸네일 미리보기 (2장 이상일 때) */}
      {visible.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {visible.map((u, i) => (
            <button
              key={u}
              type="button"
              aria-label={`${i + 1}번째 이미지 보기`}
              onClick={() => setIdx(i)}
              className={`relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === cur ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt=""
                className="h-full w-full object-cover"
                onError={() => markBroken(u)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
