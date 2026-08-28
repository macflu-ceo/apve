"use client";

import { Children, useState, type ReactNode } from "react";

/**
 * 상품 그리드 — 처음 initial개만 노출하고, "더보기"를 누를 때마다 step개씩 추가로 펼친다.
 * (한 번에 다 펼치지 않고 단계적으로 늘어남 → 진열 타이틀당 100개까지 자연스럽게)
 * 카드(children)는 서버에서 미리 생성해 넘긴다.
 */
export default function ExpandableGrid({
  children,
  initial = 8,
  step = 10,
}: {
  children: ReactNode;
  initial?: number;
  step?: number;
}) {
  const items = Children.toArray(children);
  const [count, setCount] = useState(initial);
  const shown = items.slice(0, count);
  const remaining = items.length - count;
  const nextAdd = Math.min(step, remaining);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown}
      </div>

      {items.length > initial && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {remaining > 0 ? (
            <>
              <button
                onClick={() => setCount((c) => c + step)}
                className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-bold text-ink hover:bg-ink hover:text-white"
              >
                더보기 (+{nextAdd})
              </button>
              <span className="text-xs text-sub">
                {count} / {items.length}
              </span>
            </>
          ) : (
            <button
              onClick={() => setCount(initial)}
              className="rounded-full border border-line px-6 py-2.5 text-sm font-bold text-sub hover:bg-line/40"
            >
              접기
            </button>
          )}
        </div>
      )}
    </>
  );
}
