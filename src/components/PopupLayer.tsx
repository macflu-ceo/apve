"use client";

import { useEffect, useState } from "react";

export type PopupItem = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
};

const HIDE_KEY = "popup-hide-until"; // { [id]: yyyy-mm-dd(다음날 0시 ISO) }

function todayStr() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

export default function PopupLayer({ popups }: { popups: PopupItem[] }) {
  const [visible, setVisible] = useState<PopupItem[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let hide: Record<string, string> = {};
    try {
      hide = JSON.parse(localStorage.getItem(HIDE_KEY) || "{}");
    } catch {
      hide = {};
    }
    const today = todayStr();
    const list = popups.filter((p) => hide[p.id] !== today);
    setVisible(list);
    setIdx(0);
  }, [popups]);

  if (visible.length === 0) return null;
  const cur = visible[Math.min(idx, visible.length - 1)];

  const closeAll = () => setVisible([]);

  const hideToday = () => {
    try {
      const hide = JSON.parse(localStorage.getItem(HIDE_KEY) || "{}");
      const today = todayStr();
      for (const p of visible) hide[p.id] = today;
      localStorage.setItem(HIDE_KEY, JSON.stringify(hide));
    } catch {
      /* 무시 */
    }
    setVisible([]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={closeAll}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl2 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이미지 (링크 있으면 클릭 이동) */}
        {cur.linkUrl ? (
          <a href={cur.linkUrl} target="_blank" rel="noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.imageUrl} alt={cur.title} className="w-full object-cover" />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cur.imageUrl} alt={cur.title} className="w-full object-cover" />
        )}

        {/* 캐러셀 컨트롤 (2개 이상) */}
        {visible.length > 1 && (
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => setIdx((i) => (i - 1 + visible.length) % visible.length)}
              className="rounded-full px-3 py-1 text-lg text-ink/60 hover:bg-black/5"
              aria-label="이전"
            >
              ‹
            </button>
            <div className="flex gap-1.5">
              {visible.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-ink" : "bg-ink/25"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIdx((i) => (i + 1) % visible.length)}
              className="rounded-full px-3 py-1 text-lg text-ink/60 hover:bg-black/5"
              aria-label="다음"
            >
              ›
            </button>
          </div>
        )}

        {/* 하단 바 */}
        <div className="flex items-center justify-between border-t border-line text-sm">
          <button onClick={hideToday} className="flex-1 py-3 text-ink/60 hover:bg-black/[0.03]">
            오늘 하루 보지 않기
          </button>
          <div className="h-6 w-px bg-line" />
          <button onClick={closeAll} className="flex-1 py-3 font-semibold text-ink hover:bg-black/[0.03]">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
