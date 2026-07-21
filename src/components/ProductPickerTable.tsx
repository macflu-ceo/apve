"use client";

import { useMemo, useState } from "react";
import { won } from "@/lib/format";

export type PickProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  image: string | null;
  salePrice: number | null;
  goodsNo: string;
  stock: number | null;
  createdAt: string;
};

const SORTS = [
  { key: "recent", label: "최신등록순" },
  { key: "old", label: "오래된순" },
  { key: "priceHigh", label: "가격 높은순" },
  { key: "priceLow", label: "가격 낮은순" },
  { key: "display", label: "진열순서(선택 먼저)" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

/** 엑셀형 상품 선택 리스트 (검색·브랜드·카테고리 필터 + 다중선택, 선택순서 유지) */
export default function ProductPickerTable({
  products,
  selected,
  onChange,
}: {
  products: PickProduct[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort() as string[],
    [products]
  );
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort() as string[],
    [products]
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (category && p.category !== category) return false;
      if (selectedOnly && !selected.includes(p.id)) return false;
      if (kw) {
        const hay = `${p.name} ${p.brand ?? ""} ${p.goodsNo}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    const price = (p: PickProduct) => p.salePrice ?? -1;
    const selIdx = (p: PickProduct) => {
      const i = selected.indexOf(p.id);
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    };
    const sorted = [...list];
    switch (sortKey) {
      case "recent": sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case "old": sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case "priceHigh": sorted.sort((a, b) => price(b) - price(a)); break;
      case "priceLow": sorted.sort((a, b) => price(a) - price(b)); break;
      case "display": sorted.sort((a, b) => selIdx(a) - selIdx(b)); break;
    }
    return sorted;
  }, [products, q, brand, category, selectedOnly, selected, sortKey]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const addAllFiltered = () => onChange([...new Set([...selected, ...filtered.map((p) => p.id)])]);
  const removeAllFiltered = () => {
    const f = new Set(filtered.map((p) => p.id));
    onChange(selected.filter((id) => !f.has(id)));
  };

  return (
    <div>
      {/* 필터 바 */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="상품명·브랜드·goodsNo 검색"
          className="w-56 rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
          <option value="">브랜드 전체</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
          <option value="">카테고리 전체</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-md border border-line px-2 py-1.5 text-sm">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm text-sub">
          <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly(e.target.checked)} />
          선택만
        </label>
        <span className="ml-auto text-xs text-sub">
          {filtered.length}개 표시 · <b className="text-brand">{selected.length}개 선택</b>
        </span>
        <button type="button" onClick={addAllFiltered} className="rounded-md border border-line px-2 py-1 text-xs hover:border-ink">
          현재 전체선택
        </button>
        <button type="button" onClick={removeAllFiltered} className="rounded-md border border-line px-2 py-1 text-xs hover:border-ink">
          현재 해제
        </button>
      </div>

      {/* 테이블 */}
      <div className="max-h-[520px] overflow-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 z-10 bg-[#f7f6f4] text-left text-xs text-sub">
            <tr>
              <th className="w-14 px-2 py-2">선택</th>
              <th className="w-12 px-2 py-2">이미지</th>
              <th className="px-2 py-2">상품명</th>
              <th className="w-28 px-2 py-2">브랜드</th>
              <th className="w-20 px-2 py-2">카테고리</th>
              <th className="w-24 px-2 py-2 text-right">판매가</th>
              <th className="w-14 px-2 py-2 text-right">재고</th>
              <th className="w-24 px-2 py-2">goodsNo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-sub">조건에 맞는 상품이 없습니다.</td>
              </tr>
            ) : (
              filtered.map((p) => {
                const idx = selected.indexOf(p.id);
                const on = idx >= 0;
                return (
                  <tr
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`cursor-pointer border-t border-line ${on ? "bg-brand/5" : "hover:bg-black/[0.02]"}`}
                  >
                    <td className="px-2 py-1.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                          on ? "bg-brand text-white" : "border border-line text-transparent"
                        }`}
                      >
                        {on ? idx + 1 : "0"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-[#f0f0f0]" />
                      )}
                    </td>
                    <td className="max-w-0 truncate px-2 py-1.5 font-medium">{p.name}</td>
                    <td className="px-2 py-1.5 text-ink/70">{p.brand ?? "-"}</td>
                    <td className="px-2 py-1.5 text-ink/70">{p.category ?? "-"}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{won(p.salePrice)}</td>
                    <td className="px-2 py-1.5 text-right text-ink/70">{p.stock ?? "-"}</td>
                    <td className="px-2 py-1.5 text-xs text-sub">{p.goodsNo}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
