"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ProductRow, { type P } from "./ProductRow";
import { deleteProducts } from "./actions";

type SortKey = "new" | "old" | "name" | "priceHigh" | "priceLow" | "discountHigh";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "new", label: "최신 등록순" },
  { key: "old", label: "오래된순" },
  { key: "name", label: "이름순(가나다)" },
  { key: "priceHigh", label: "판매가 높은순" },
  { key: "priceLow", label: "판매가 낮은순" },
  { key: "discountHigh", label: "할인율 높은순" },
];

const discountOf = (p: P) =>
  p.listPrice && p.salePrice && p.listPrice > p.salePrice ? (p.listPrice - p.salePrice) / p.listPrice : 0;

export default function ProductTable({ products }: { products: P[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  // 검색 · 필터 · 정렬
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "hidden">("all");
  const [sort, setSort] = useState<SortKey>("new");

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "ko")),
    [products]
  );

  const view = useMemo(() => {
    let list = products;
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (p) =>
          (p.name ?? "").toLowerCase().includes(s) ||
          (p.brand ?? "").toLowerCase().includes(s) ||
          (p.goodsNo ?? "").toLowerCase().includes(s) ||
          (p.category ?? "").toLowerCase().includes(s)
      );
    }
    if (brand) list = list.filter((p) => p.brand === brand);
    if (status === "active") list = list.filter((p) => p.active);
    else if (status === "hidden") list = list.filter((p) => !p.active);

    const arr = [...list];
    switch (sort) {
      case "new":
        arr.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
      case "old":
        arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        break;
      case "name":
        arr.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ko"));
        break;
      case "priceHigh":
        arr.sort((a, b) => (b.salePrice ?? 0) - (a.salePrice ?? 0));
        break;
      case "priceLow":
        arr.sort((a, b) => (a.salePrice ?? 0) - (b.salePrice ?? 0));
        break;
      case "discountHigh":
        arr.sort((a, b) => discountOf(b) - discountOf(a));
        break;
    }
    return arr;
  }, [products, q, brand, status, sort]);

  const viewIds = view.map((p) => p.id);
  const allChecked = viewIds.length > 0 && viewIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      const allSel = viewIds.length > 0 && viewIds.every((id) => prev.has(id));
      const n = new Set(prev);
      if (allSel) viewIds.forEach((id) => n.delete(id));
      else viewIds.forEach((id) => n.add(id));
      return n;
    });
  }
  function removeSelected() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개 상품을 삭제할까요? (되돌릴 수 없습니다)`)) return;
    const ids = Array.from(selected);
    start(async () => {
      await deleteProducts(ids);
      setSelected(new Set());
      router.refresh();
    });
  }
  function resetFilters() {
    setQ("");
    setBrand("");
    setStatus("all");
    setSort("new");
  }

  const filtered = q.trim() !== "" || brand !== "" || status !== "all";

  return (
    <div>
      {/* 검색 · 필터 · 정렬 툴바 */}
      <div className="card mb-3 flex flex-wrap items-center gap-2 p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색 (상품명 · 브랜드 · 상품번호 · 카테고리)"
          className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
        />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-line px-2 py-1.5 text-sm"
        >
          <option value="">브랜드 전체</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | "active" | "hidden")}
          className="rounded-lg border border-line px-2 py-1.5 text-sm"
        >
          <option value="all">노출 전체</option>
          <option value="active">노출중</option>
          <option value="hidden">숨김</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-line px-2 py-1.5 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        {filtered && (
          <button onClick={resetFilters} className="text-xs text-sub hover:underline">
            초기화
          </button>
        )}
      </div>

      {/* 선택 액션 바 + 개수 */}
      <div className="mb-2 flex h-8 items-center gap-3">
        {selected.size > 0 ? (
          <>
            <span className="text-sm text-sub">
              선택 <b className="text-ink">{selected.size}</b>개
            </span>
            <button
              onClick={removeSelected}
              disabled={pending}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {pending ? "삭제 중…" : "선택 삭제"}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-sub hover:underline">
              선택 해제
            </button>
          </>
        ) : (
          <span className="text-xs text-sub">
            {filtered ? (
              <>
                전체 {products.length}개 중 <b className="text-ink">{view.length}</b>개 표시
              </>
            ) : (
              <>체크해서 여러 개를 한 번에 삭제할 수 있어요. (총 {products.length}개)</>
            )}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line text-left text-sub">
            <tr>
              <th className="w-8 py-2">
                <input type="checkbox" className="h-4 w-4" checked={allChecked} onChange={toggleAll} />
              </th>
              <th>이미지</th>
              <th>상품</th>
              <th>정가</th>
              <th>할인율</th>
              <th>판매가</th>
              <th>원산지</th>
              <th>태그</th>
              <th>노출</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {view.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-sub">
                  검색/필터 결과가 없습니다.
                </td>
              </tr>
            )}
            {view.map((p) => (
              <ProductRow key={p.id} p={p} checked={selected.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
