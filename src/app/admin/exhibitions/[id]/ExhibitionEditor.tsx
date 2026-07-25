"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import ProductPickerTable, { PickProduct } from "@/components/ProductPickerTable";
import { updateExhibition, setExhibitionProducts } from "../actions";

type Ex = {
  id: string;
  title: string;
  subtitle: string | null;
  bannerImageUrl: string | null;
  bannerFrom: string;
  bannerTo: string;
  sort: number;
};

export default function ExhibitionEditor({
  exhibition,
  products,
  selectedIds,
  refPercent = 0,
}: {
  exhibition: Ex;
  products: PickProduct[];
  selectedIds: string[];
  refPercent?: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [m, setM] = useState({
    title: exhibition.title,
    subtitle: exhibition.subtitle ?? "",
    bannerImageUrl: exhibition.bannerImageUrl ?? "",
    bannerFrom: exhibition.bannerFrom,
    bannerTo: exhibition.bannerTo,
    sort: String(exhibition.sort),
  });
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const set = <K extends keyof typeof m>(k: K, v: string) => setM((p) => ({ ...p, [k]: v }));

  function save() {
    start(async () => {
      await updateExhibition(exhibition.id, {
        title: m.title,
        subtitle: m.subtitle || null,
        bannerImageUrl: m.bannerImageUrl || null,
        bannerFrom: m.bannerFrom,
        bannerTo: m.bannerTo,
        sort: Number(m.sort),
      });
      await setExhibitionProducts(exhibition.id, selected);
      setMsg("저장되었습니다.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* 배너/이름 */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold text-sub">상단 배너 미리보기</div>
          <div
            className="relative flex aspect-[21/9] flex-col justify-end overflow-hidden rounded-xl2 p-6"
            style={
              m.bannerImageUrl
                ? { backgroundImage: `url(${m.bannerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { backgroundImage: `linear-gradient(135deg, ${m.bannerFrom}, ${m.bannerTo})` }
            }
          >
            {m.bannerImageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
            <div className={`relative text-2xl font-black ${m.bannerImageUrl ? "text-white" : "text-ink"}`}>{m.title || "기획전 이름"}</div>
            {m.subtitle && <div className={`relative mt-1 text-sm font-semibold ${m.bannerImageUrl ? "text-white/85" : "text-ink/60"}`}>{m.subtitle}</div>}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">기획전 이름</label>
            <input className="field mt-1" value={m.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">부제</label>
            <input className="field mt-1" value={m.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
          <ImageUploader label="상단 배너 이미지" value={m.bannerImageUrl} onChange={(url) => set("bannerImageUrl", url)} />
          <div className="flex gap-3">
            <div>
              <label className="text-xs text-sub">시작색</label>
              <input type="color" className="mt-1 h-10 w-16 rounded border border-line" value={m.bannerFrom} onChange={(e) => set("bannerFrom", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-sub">끝색</label>
              <input type="color" className="mt-1 h-10 w-16 rounded border border-line" value={m.bannerTo} onChange={(e) => set("bannerTo", e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-sub">노출 순서</label>
              <input type="number" className="field mt-1" value={m.sort} onChange={(e) => set("sort", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* 상품 선택 (리스트형 + 필터) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">담을 상품 선택</div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-green-700">{msg}</span>}
            <button className="btn-brand" onClick={save} disabled={pending}>
              {pending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
        <ProductPickerTable products={products} selected={selected} onChange={setSelected} refPercent={refPercent} />
      </div>
    </div>
  );
}
