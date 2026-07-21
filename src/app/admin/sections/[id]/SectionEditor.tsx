"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSection, setSectionProducts } from "../actions";
import ProductPickerTable, { PickProduct } from "@/components/ProductPickerTable";

export default function SectionEditor({
  section,
  products,
  selectedIds,
}: {
  section: { id: string; title: string; subtitle: string | null; sort: number };
  products: PickProduct[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
  const [sort, setSort] = useState(String(section.sort));
  const [selected, setSelected] = useState<string[]>(selectedIds);

  function save() {
    start(async () => {
      await updateSection(section.id, { title, subtitle: subtitle || null, sort: Number(sort) });
      await setSectionProducts(section.id, selected);
      setMsg("저장되었습니다.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* 섹션 메타 */}
      <div className="card grid gap-3 p-5 sm:grid-cols-[2fr_2fr_1fr]">
        <div>
          <label className="text-xs text-sub">섹션 제목</label>
          <input className="field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-sub">부제</label>
          <input className="field mt-1" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-sub">순서</label>
          <input type="number" className="field mt-1" value={sort} onChange={(e) => setSort(e.target.value)} />
        </div>
      </div>

      {/* 상품 선택 (리스트형 + 필터) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">진열 상품 선택</div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-green-700">{msg}</span>}
            <button className="btn-brand" onClick={save} disabled={pending}>
              {pending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
        <ProductPickerTable products={products} selected={selected} onChange={setSelected} />
      </div>
    </div>
  );
}
