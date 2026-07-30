"use client";

import { Children, useState, type ReactNode } from "react";

/**
 * 상품 그리드 — 기본 limit개만 노출하고 "더보기"로 나머지를 아래에 펼친다.
 * 카드(children)는 서버에서 미리 생성해 넘긴다. (ProductCard 구조 변경 불필요)
 */
export default function ExpandableGrid({ children, limit = 15 }: { children: ReactNode; limit?: number }) {
  const items = Children.toArray(children);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, limit);
  const hidden = items.length - limit;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown}
      </div>

      {items.length > limit && (
        <div className="mt-6 text-center">
          {expanded ? (
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full border border-line px-6 py-2.5 text-sm font-bold text-sub hover:bg-line/40"
            >
              접기
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="rounded-full border border-ink/20 px-6 py-2.5 text-sm font-bold text-ink hover:bg-ink hover:text-white"
            >
              더보기 (+{hidden})
            </button>
          )}
        </div>
      )}
    </>
  );
}
