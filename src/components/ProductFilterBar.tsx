"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/productFilter";

type Facets = { brands: string[]; categories: string[]; seasons: string[] };

/** 소비자 화면 상품 필터 바 — URL 쿼리로 상태 관리 */
export default function ProductFilterBar({ facets }: { facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const get = (k: string) => sp.get(k) ?? "";

  function setParam(patch: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const activeCount = ["category", "brand", "season", "minSale", "maxSale"].filter((k) => get(k)).length;

  const chip = "rounded-md border border-line bg-white px-2.5 py-1.5 text-sm";

  return (
    <div className="sticky top-[52px] z-30 -mx-4 mb-4 border-b border-line bg-white/95 px-4 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <select value={get("category")} onChange={(e) => setParam({ category: e.target.value })} className={chip}>
          <option value="">카테고리</option>
          {facets.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={get("brand")} onChange={(e) => setParam({ brand: e.target.value })} className={chip}>
          <option value="">브랜드</option>
          {facets.brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select value={get("season")} onChange={(e) => setParam({ season: e.target.value })} className={chip}>
          <option value="">시즌</option>
          {facets.seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* 가격대 (공급가) */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            defaultValue={get("minSale")}
            onBlur={(e) => setParam({ minSale: e.target.value })}
            placeholder="최소가"
            className="w-20 rounded-md border border-line px-2 py-1.5 text-sm"
          />
          <span className="text-xs text-sub">~</span>
          <input
            type="number"
            inputMode="numeric"
            defaultValue={get("maxSale")}
            onBlur={(e) => setParam({ maxSale: e.target.value })}
            placeholder="최대가"
            className="w-20 rounded-md border border-line px-2 py-1.5 text-sm"
          />
        </div>

        <select value={get("sort") || "recent"} onChange={(e) => setParam({ sort: e.target.value })} className={`${chip} ml-auto`}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="rounded-md border border-line px-2.5 py-1.5 text-sm text-sub hover:border-ink/40"
          >
            초기화 ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
