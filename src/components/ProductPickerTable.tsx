"use client";

import { useMemo, useState } from "react";
import { won } from "@/lib/format";
import { seasonRank } from "@/lib/season";

export type PickProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  season: string | null;
  image: string | null;
  listPrice: number | null;
  salePrice: number | null;
  goodsNo: string;
  stock: number | null;
  createdAt: string; // ISO
};

const SORTS = [
  { key: "recent", label: "최신등록순" },
  { key: "old", label: "오래된순" },
  { key: "commHigh", label: "수수료 높은순" },
  { key: "commLow", label: "수수료 낮은순" },
  { key: "saleHigh", label: "공급가 높은순" },
  { key: "saleLow", label: "공급가 낮은순" },
  { key: "listHigh", label: "정가 높은순" },
  { key: "discountHigh", label: "할인율 높은순" },
  { key: "seasonNew", label: "최신 시즌순" },
  { key: "display", label: "진열순서(선택 먼저)" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const num = (v: string) => {
  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? undefined : n;
};

/**
 * 엑셀형 상품 선택 리스트.
 * 필터: 검색 · 브랜드 · 카테고리 · 시즌 · 정가/공급가/수수료 범위 · 등록일 범위 + 다중선택(선택순서 유지)
 * refPercent: 예상 수수료 계산에 쓰는 기준 수수료율(%) — 보통 최고 등급
 */
export default function ProductPickerTable({
  products,
  selected,
  onChange,
  refPercent = 0,
}: {
  products: PickProduct[];
  selected: string[];
  onChange: (ids: string[]) => void;
  refPercent?: number;
}) {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [season, setSeason] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [more, setMore] = useState(false);
  // 범위 필터
  const [minSale, setMinSale] = useState("");
  const [maxSale, setMaxSale] = useState("");
  const [minList, setMinList] = useState("");
  const [maxList, setMaxList] = useState("");
  const [minComm, setMinComm] = useState("");
  const [maxComm, setMaxComm] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const comm = (p: PickProduct) => Math.round(((p.salePrice ?? 0) * refPercent) / 100);

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort() as string[],
    [products]
  );
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort() as string[],
    [products]
  );
  const seasons = useMemo(
    () =>
      ([...new Set(products.map((p) => p.season).filter(Boolean))] as string[]).sort(
        (a, b) => seasonRank(b) - seasonRank(a)
      ),
    [products]
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const nMinSale = num(minSale), nMaxSale = num(maxSale);
    const nMinList = num(minList), nMaxList = num(maxList);
    const nMinComm = num(minComm), nMaxComm = num(maxComm);

    const list = products.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (category && p.category !== category) return false;
      if (season && p.season !== season) return false;
      if (selectedOnly && !selected.includes(p.id)) return false;
      if (kw) {
        const hay = `${p.name} ${p.brand ?? ""} ${p.goodsNo}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      const sale = p.salePrice ?? 0;
      if (nMinSale != null && sale < nMinSale) return false;
      if (nMaxSale != null && sale > nMaxSale) return false;
      const lp = p.listPrice ?? 0;
      if (nMinList != null && lp < nMinList) return false;
      if (nMaxList != null && lp > nMaxList) return false;
      const c = comm(p);
      if (nMinComm != null && c < nMinComm) return false;
      if (nMaxComm != null && c > nMaxComm) return false;
      const d = p.createdAt.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    const sale = (p: PickProduct) => p.salePrice ?? -1;
    const lp = (p: PickProduct) => p.listPrice ?? -1;
    const disc = (p: PickProduct) =>
      p.listPrice && p.salePrice && p.listPrice > 0 ? 1 - p.salePrice / p.listPrice : -1;
    const selIdx = (p: PickProduct) => {
      const i = selected.indexOf(p.id);
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    };
    const sorted = [...list];
    switch (sortKey) {
      case "recent": sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case "old": sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case "commHigh":
      case "saleHigh": sorted.sort((a, b) => sale(b) - sale(a)); break;
      case "commLow":
      case "saleLow": sorted.sort((a, b) => sale(a) - sale(b)); break;
      case "listHigh": sorted.sort((a, b) => lp(b) - lp(a)); break;
      case "discountHigh": sorted.sort((a, b) => disc(b) - disc(a)); break;
      case "seasonNew": sorted.sort((a, b) => seasonRank(b.season) - seasonRank(a.season)); break;
      case "display": sorted.sort((a, b) => selIdx(a) - selIdx(b)); break;
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, q, brand, category, season, selectedOnly, selected, sortKey,
      minSale, maxSale, minList, maxList, minComm, maxComm, from, to, refPercent]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const addAllFiltered = () => onChange([...new Set([...selected, ...filtered.map((p) => p.id)])]);
  const removeAllFiltered = () => {
    const f = new Set(filtered.map((p) => p.id));
    onChange(selected.filter((id) => !f.has(id)));
  };
  const reset = () => {
    setQ(""); setBrand(""); setCategory(""); setSeason("");
    setMinSale(""); setMaxSale(""); setMinList(""); setMaxList("");
    setMinComm(""); setMaxComm(""); setFrom(""); setTo(""); setSelectedOnly(false);
  };

  const sel = "rounded-md border border-line px-2 py-1.5 text-sm";
  const rng = "w-24 rounded-md border border-line px-2 py-1.5 text-sm";

  return (
    <div>
      {/* 필터 바 */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="상품명·브랜드·goodsNo"
          className="w-48 rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className={sel}>
          <option value="">브랜드 전체</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={sel}>
          <option value="">카테고리 전체</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={season} onChange={(e) => setSeason(e.target.value)} className={sel}>
          <option value="">시즌 전체</option>
          {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={sel}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button type="button" onClick={() => setMore(!more)} className="rounded-md border border-line px-2 py-1.5 text-sm text-sub hover:border-ink">
          {more ? "상세 필터 ▲" : "상세 필터 ▼"}
        </button>
        <label className="flex items-center gap-1 text-sm text-sub">
          <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly(e.target.checked)} />
          선택만
        </label>
      </div>

      {/* 상세 범위 필터 */}
      {more && (
        <div className="mb-2 flex flex-wrap items-center gap-3 rounded-lg bg-[#fbfaf9] p-3 text-sm">
          <span className="flex items-center gap-1">공급가
            <input value={minSale} onChange={(e) => setMinSale(e.target.value)} placeholder="최소" className={rng} inputMode="numeric" />~
            <input value={maxSale} onChange={(e) => setMaxSale(e.target.value)} placeholder="최대" className={rng} inputMode="numeric" />
          </span>
          <span className="flex items-center gap-1">정가
            <input value={minList} onChange={(e) => setMinList(e.target.value)} placeholder="최소" className={rng} inputMode="numeric" />~
            <input value={maxList} onChange={(e) => setMaxList(e.target.value)} placeholder="최대" className={rng} inputMode="numeric" />
          </span>
          <span className="flex items-center gap-1">수수료
            <input value={minComm} onChange={(e) => setMinComm(e.target.value)} placeholder="최소" className={rng} inputMode="numeric" />~
            <input value={maxComm} onChange={(e) => setMaxComm(e.target.value)} placeholder="최대" className={rng} inputMode="numeric" />
          </span>
          <span className="flex items-center gap-1">등록일
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />~
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />
          </span>
          <button type="button" onClick={reset} className="rounded-md border border-line px-2 py-1 text-xs hover:border-ink">필터 초기화</button>
          {refPercent > 0 && <span className="text-xs text-sub">※ 수수료 = 공급가 × {refPercent}% (기준 등급)</span>}
        </div>
      )}

      {/* 액션 */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-sub">{filtered.length}개 표시 · <b className="text-brand">{selected.length}개 선택</b></span>
        <button type="button" onClick={addAllFiltered} className="rounded-md border border-line px-2 py-1 hover:border-ink">현재 전체선택</button>
        <button type="button" onClick={removeAllFiltered} className="rounded-md border border-line px-2 py-1 hover:border-ink">현재 해제</button>
        <button type="button" onClick={() => onChange([])} className="rounded-md border border-line px-2 py-1 text-red-500 hover:border-red-400">전체 해제</button>
      </div>

      {/* 테이블 */}
      <div className="max-h-[520px] overflow-auto rounded-lg border border-line">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="sticky top-0 z-10 bg-[#f7f6f4] text-left text-xs text-sub">
            <tr>
              <th className="w-12 px-2 py-2">선택</th>
              <th className="w-12 px-2 py-2">이미지</th>
              <th className="px-2 py-2">상품명</th>
              <th className="w-24 px-2 py-2">브랜드</th>
              <th className="w-16 px-2 py-2">카테고리</th>
              <th className="w-14 px-2 py-2">시즌</th>
              <th className="w-24 px-2 py-2 text-right">정가</th>
              <th className="w-24 px-2 py-2 text-right">공급가</th>
              {refPercent > 0 && <th className="w-24 px-2 py-2 text-right">수수료</th>}
              <th className="w-12 px-2 py-2 text-right">재고</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={refPercent > 0 ? 10 : 9} className="px-2 py-8 text-center text-sub">조건에 맞는 상품이 없습니다.</td></tr>
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
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${on ? "bg-brand text-white" : "border border-line text-transparent"}`}>
                        {on ? idx + 1 : "0"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : <div className="h-8 w-8 rounded bg-[#f0f0f0]" />}
                    </td>
                    <td className="max-w-0 truncate px-2 py-1.5 font-medium">{p.name}</td>
                    <td className="px-2 py-1.5 text-ink/70">{p.brand ?? "-"}</td>
                    <td className="px-2 py-1.5 text-ink/70">{p.category ?? "-"}</td>
                    <td className="px-2 py-1.5 text-ink/70">{p.season ?? "-"}</td>
                    <td className="px-2 py-1.5 text-right text-sub">{won(p.listPrice)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{won(p.salePrice)}</td>
                    {refPercent > 0 && <td className="px-2 py-1.5 text-right font-semibold text-brand">{won(comm(p))}</td>}
                    <td className="px-2 py-1.5 text-right text-ink/70">{p.stock ?? "-"}</td>
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
