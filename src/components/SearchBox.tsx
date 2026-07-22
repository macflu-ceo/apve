"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // 자동완성 (디바운스)
  useEffect(() => {
    const kw = q.trim();
    if (!kw) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(kw)}`);
        const data = await res.json();
        setItems(data.items ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        setItems([]);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (kw: string) => {
    const v = kw.trim();
    if (!v) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(v)}`);
  };

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) {
      if (e.key === "Enter") go(q);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active >= 0 ? items[active] : q);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-full bg-[#f5f3f0] px-4 py-2.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-sub">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="브랜드, 상품 검색 (예: 구찌 가방)"
          className="w-full bg-transparent text-sm outline-none placeholder:text-sub"
        />
      </div>

      {open && items.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {items.map((it, i) => (
            <li key={it}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(it)}
                className={`block w-full px-4 py-2 text-left text-sm ${i === active ? "bg-brandsoft" : "hover:bg-black/[0.03]"}`}
              >
                {it}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
