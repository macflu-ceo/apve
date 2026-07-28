"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ProductRow, { type P } from "./ProductRow";
import { deleteProducts } from "./actions";

export default function ProductTable({ products }: { products: P[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const allIds = products.map((p) => p.id);
  const allChecked = allIds.length > 0 && selected.size === allIds.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));
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

  return (
    <div>
      {/* 선택 액션 바 */}
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
          <span className="text-xs text-sub">체크해서 여러 개를 한 번에 삭제할 수 있어요.</span>
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
            {products.map((p) => (
              <ProductRow key={p.id} p={p} checked={selected.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
