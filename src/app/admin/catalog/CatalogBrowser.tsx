"use client";

import { useState, useTransition } from "react";
import { browseCatalogAction, importSelectedAction, type BrowseItem } from "./actions";
import type { CatalogSort } from "@/lib/godomall/catalog";

const won = (n: number) => n.toLocaleString("ko-KR");

const SORTS: { key: CatalogSort; label: string }[] = [
  { key: "new", label: "신상순" },
  { key: "sales", label: "인기순" },
  { key: "margin", label: "마진순" },
  { key: "priceHigh", label: "고가순" },
  { key: "priceLow", label: "저가순" },
];

export default function CatalogBrowser() {
  const [newDays, setNewDays] = useState(0);
  const [brand, setBrand] = useState("");
  const [minMargin, setMinMargin] = useState(0);
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState<CatalogSort>("new");
  const [limit, setLimit] = useState(50);

  const [items, setItems] = useState<BrowseItem[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string>("");
  const [loading, startLoad] = useTransition();
  const [importing, startImport] = useTransition();

  function browse() {
    setMsg("");
    startLoad(async () => {
      const r = await browseCatalogAction({ newDays, brand: brand.trim(), minMargin, inStock, sort, limit });
      if (!r.ok) {
        setItems([]);
        setMsg(`❌ ${r.message}`);
        return;
      }
      setItems(r.items ?? []);
      setSelected(new Set());
      setMsg(`총 ${r.count ?? r.items?.length ?? 0}개 조회`);
    });
  }

  function toggle(goodsNo: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(goodsNo) ? next.delete(goodsNo) : next.add(goodsNo);
      return next;
    });
  }

  function toggleAll() {
    if (!items) return;
    const importable = items.filter((i) => !i.imported).map((i) => i.goodsNo);
    setSelected((prev) => (prev.size === importable.length ? new Set() : new Set(importable)));
  }

  function importSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    startImport(async () => {
      const r = await importSelectedAction(ids);
      setMsg(r.ok ? `✅ ${r.message}` : `❌ ${r.message}`);
      if (r.ok) {
        // 등록된 것들을 imported=true 로 표시
        setItems((prev) => (prev ? prev.map((i) => (ids.includes(i.goodsNo) ? { ...i, imported: true } : i)) : prev));
        setSelected(new Set());
      }
    });
  }

  const importableCount = items?.filter((i) => !i.imported).length ?? 0;

  return (
    <div>
      {/* 필터 바 */}
      <div className="card mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <label className="text-xs">
            <span className="mb-1 block font-bold text-sub">신상(최근 N일)</span>
            <input
              type="number"
              min={0}
              value={newDays}
              onChange={(e) => setNewDays(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
              placeholder="0=전체"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-bold text-sub">브랜드</span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
              placeholder="예: TOTEME"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-bold text-sub">최소 마진율 %</span>
            <input
              type="number"
              min={0}
              max={100}
              value={minMargin}
              onChange={(e) => setMinMargin(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-bold text-sub">정렬</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CatalogSort)}
              className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-bold text-sub">개수</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 text-xs">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4" />
            <span className="pb-1.5 font-bold text-sub">품절 제외</span>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={browse}
            disabled={loading}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "조회 중…" : "고도몰 상품 조회"}
          </button>
          {msg && <span className="text-sm text-sub">{msg}</span>}
        </div>
      </div>

      {/* 선택 액션 바 */}
      {items && items.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-sub">
            등록 가능 {importableCount}개 · 선택 <b className="text-ink">{selected.size}</b>개
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAll} className="rounded-lg border border-line px-3 py-1.5 text-sm">
              {selected.size === importableCount && importableCount > 0 ? "선택 해제" : "전체 선택"}
            </button>
            <button
              onClick={importSelected}
              disabled={importing || selected.size === 0}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {importing ? "가져오는 중…" : `선택 ${selected.size}개 가져오기`}
            </button>
          </div>
        </div>
      )}

      {/* 결과 테이블 */}
      {items && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-line text-left text-sub">
              <tr>
                <th className="w-8 py-2"></th>
                <th>상품</th>
                <th className="text-right">판매가</th>
                <th className="text-right">정가</th>
                <th className="text-right">공급가</th>
                <th className="text-right">마진</th>
                <th className="text-right">재고</th>
                <th className="text-right">판매</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sub">
                    조회 결과가 없습니다.
                  </td>
                </tr>
              )}
              {items.map((i) => (
                <tr key={i.goodsNo} className={`border-b border-line ${i.imported ? "opacity-60" : ""}`}>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      disabled={i.imported}
                      checked={selected.has(i.goodsNo)}
                      onChange={() => toggle(i.goodsNo)}
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{i.goodsNm}</span>
                      {i.isNew && <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">신상</span>}
                    </div>
                    <div className="text-[11px] text-sub">
                      {i.brand} · {i.origin} · #{i.goodsNo}
                    </div>
                  </td>
                  <td className="text-right tabular-nums">{won(i.sellPrice)}</td>
                  <td className="text-right tabular-nums text-sub">{won(i.listPrice)}</td>
                  <td className="text-right tabular-nums text-sub">{won(i.costPrice)}</td>
                  <td className="text-right tabular-nums">
                    <div>{won(i.marginAmt)}</div>
                    <div className="text-[11px] text-sub">{i.marginRate}%</div>
                  </td>
                  <td className={`text-right tabular-nums ${i.soldOut ? "text-red-500" : ""}`}>
                    {i.soldOut ? "품절" : i.stock}
                  </td>
                  <td className="text-right tabular-nums">{i.salesQty}</td>
                  <td>
                    {i.imported && (
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-ink/60">등록됨</span>
                    )}
                  </td>
                  <td>
                    <a href={i.viewUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">
                      원본↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
