"use client";

// 멀티링크 샵 본문 — 배너(기획전)·카테고리 필터·진열 섹션
import { useEffect, useState } from "react";
import Link from "next/link";

export type ShopItem = {
  id: string;
  url: string;
  name: string;
  brand: string | null;
  category: string | null;
  image: string | null;
  salePrice: number | null;
  listPrice: number | null;
  discount: number | null;
  sectionKey: string;
};
export type ShopGroup = { key: string; title: string };
export type ShopBanner = { id: string; imageUrl: string; title: string | null; hasSection: boolean };

const won = (n: number) => n.toLocaleString() + "원";

export function ProductCard({ item }: { item: ShopItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener"
      className="block overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(20,30,80,.07)] transition active:scale-[0.98]"
    >
      <div className="aspect-square bg-[#FAFAFC]">
        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-contain" loading="lazy" />}
      </div>
      <div className="p-2">
        {item.brand && <div className="truncate text-[10px] font-semibold text-gray-400">{item.brand}</div>}
        <div className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-snug text-gray-900">{item.name}</div>
        <div className="mt-1 text-[12px] font-extrabold text-gray-900">
          {item.discount != null && <span className="mr-0.5 text-[#13b6a6]">{item.discount}%</span>}
          {item.salePrice != null && won(item.salePrice)}
        </div>
      </div>
    </a>
  );
}

export function ProductRow({ item }: { item: ShopItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener"
      className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-[0_1px_8px_rgba(20,30,80,.06)] transition active:scale-[0.99]"
    >
      <div className="h-16 w-16 shrink-0 rounded-lg bg-[#FAFAFC]">
        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-contain" loading="lazy" />}
      </div>
      <div className="min-w-0 flex-1">
        {item.brand && <div className="text-[10.5px] font-semibold text-gray-400">{item.brand}</div>}
        <div className="truncate text-[13px] font-bold text-gray-900">{item.name}</div>
        <div className="mt-0.5 text-[13.5px] font-extrabold text-gray-900">
          {item.discount != null && <span className="mr-1 text-[#13b6a6]">{item.discount}%</span>}
          {item.salePrice != null && won(item.salePrice)}
          {item.listPrice != null && item.discount != null && (
            <span className="ml-1.5 text-[11px] font-normal text-gray-300 line-through">{won(item.listPrice)}</span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-gray-300">›</span>
    </a>
  );
}

export default function ShopBody({
  slug,
  displayName,
  banners,
  groups,
  items,
}: {
  slug: string;
  displayName: string;
  banners: ShopBanner[];
  groups: ShopGroup[];
  items: ShopItem[];
}) {
  const categories = Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c)));
  const [cat, setCat] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [catOpen, setCatOpen] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem("ml_view");
      if (v === "list" || v === "grid") setView(v);
    } catch { /* noop */ }
  }, []);
  const switchView = (v: "grid" | "list") => {
    setView(v);
    try { localStorage.setItem("ml_view", v); } catch { /* noop */ }
  };
  const visible = cat ? items.filter((i) => i.category === cat) : items;

  return (
    <>
      {/* ── 보기 방식 토글 ── */}
      {items.length > 0 && (
        <div className="mt-5 flex justify-end px-4">
          <div className="flex overflow-hidden rounded-full bg-white text-[12px] font-bold ring-1 ring-gray-200">
            <button onClick={() => switchView("grid")} className={`px-3.5 py-1.5 ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-500"}`}>▦ 상품형</button>
            <button onClick={() => switchView("list")} className={`px-3.5 py-1.5 ${view === "list" ? "bg-gray-900 text-white" : "text-gray-500"}`}>☰ 리스트형</button>
          </div>
        </div>
      )}

      {/* ── 이미지 배너 (기획전) ── */}
      {banners.length > 0 && (
        <div className="mt-3 space-y-3 px-4">
          {banners.map((b) => {
            const inner = (
              <div className="relative overflow-hidden rounded-2xl shadow-[0_4px_18px_rgba(20,30,80,.1)]">
                <img src={b.imageUrl} alt={b.title ?? ""} className="max-h-[220px] w-full object-cover" />
                {b.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
                    <span className="text-[15px] font-extrabold text-white">{b.title}</span>
                    {b.hasSection && <span className="ml-2 text-[12px] text-white/80">보러가기 →</span>}
                  </div>
                )}
              </div>
            );
            return b.hasSection ? (
              <Link key={b.id} href={`/m/${slug}/f/${b.id}`} className="block transition active:scale-[0.99]">
                {inner}
              </Link>
            ) : (
              <div key={b.id}>{inner}</div>
            );
          })}
        </div>
      )}

      {/* ── 카테고리 필터 (컴팩트 + 더보기) ── */}
      {categories.length > 1 && (() => {
        const LIMIT = 4;
        // 선택된 카테고리는 접힌 상태에서도 항상 보이게
        const head = categories.slice(0, LIMIT);
        if (cat && !head.includes(cat)) head[LIMIT - 1] = cat;
        const shown = catOpen ? categories : head;
        const chip = (on: boolean) =>
          `shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${on ? "bg-gray-900 text-white" : "bg-white text-gray-500 ring-1 ring-gray-200"}`;
        return (
          <div className={`mt-5 px-4 ${catOpen ? "flex flex-wrap gap-1.5" : "flex gap-1.5 overflow-hidden"}`}>
            <button onClick={() => setCat(null)} className={chip(cat === null)}>전체</button>
            {shown.map((c) => (
              <button key={c} onClick={() => setCat(cat === c ? null : c)} className={chip(cat === c)}>
                {c}
              </button>
            ))}
            {categories.length > LIMIT && (
              <button onClick={() => setCatOpen(!catOpen)} className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11.5px] font-bold text-gray-500">
                {catOpen ? "접기 ∧" : `+${categories.length - head.length} 더보기`}
              </button>
            )}
          </div>
        );
      })()}

      {/* ── 진열 섹션 ── */}
      {groups.map((g, gi) => {
        const rows = visible.filter((i) => i.sectionKey === g.key);
        if (rows.length === 0) return null;
        return (
          <div key={g.key} className="mt-7 px-4">
            {g.title && (
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-[17px] font-extrabold text-gray-900">{g.title}</h2>
                {gi === 0 && <span className="text-[11px] text-gray-400">{displayName} PICK</span>}
              </div>
            )}
            {view === "grid" ? (
              <div className={g.title ? "mt-3 grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-2"}>
                {rows.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className={g.title ? "mt-3 space-y-2" : "space-y-2"}>
                {rows.map((item) => (
                  <ProductRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {visible.length === 0 && items.length > 0 && (
        <div className="mt-14 text-center text-sm text-gray-400">이 카테고리에 담긴 상품이 없어요.</div>
      )}
    </>
  );
}
