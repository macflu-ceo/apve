"use client";

// 멀티링크 샵 본문 — 배너(기획전)·카테고리 필터·진열 섹션
import { useState } from "react";
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
      <div className="p-3">
        {item.brand && <div className="text-[11px] font-semibold text-gray-400">{item.brand}</div>}
        <div className="mt-0.5 line-clamp-2 text-[12.5px] font-bold leading-snug text-gray-900">{item.name}</div>
        <div className="mt-1.5 text-[14px] font-extrabold text-gray-900">
          {item.discount != null && <span className="mr-1 text-[#13b6a6]">{item.discount}%</span>}
          {item.salePrice != null && won(item.salePrice)}
        </div>
        {item.listPrice != null && item.discount != null && (
          <div className="text-[11px] text-gray-300 line-through">{won(item.listPrice)}</div>
        )}
      </div>
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
  const visible = cat ? items.filter((i) => i.category === cat) : items;

  return (
    <>
      {/* ── 이미지 배너 (기획전) ── */}
      {banners.length > 0 && (
        <div className="mt-6 space-y-3 px-4">
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

      {/* ── 카테고리 필터 ── */}
      {categories.length > 1 && (
        <div className="mt-6 flex gap-1.5 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setCat(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold ${cat === null ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
          >
            전체
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(cat === c ? null : c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold ${cat === c ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

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
            <div className={g.title ? "mt-3 grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
              {rows.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}

      {visible.length === 0 && items.length > 0 && (
        <div className="mt-14 text-center text-sm text-gray-400">이 카테고리에 담긴 상품이 없어요.</div>
      )}
    </>
  );
}
