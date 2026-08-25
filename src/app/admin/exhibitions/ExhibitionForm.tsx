"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExhibition } from "./actions";
import ImageUploader from "@/components/ImageUploader";

export default function ExhibitionForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    title: "",
    subtitle: "",
    bannerImageUrl: "",
    bannerFrom: "#E7ECFF",
    bannerTo: "#B9C6FF",
    sort: "0",
  });
  const set = <K extends keyof typeof f>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createExhibition({ ...f, sort: Number(f.sort) });
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok && res.id) router.push(`/admin/exhibitions/${res.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
      {/* 상단 배너 미리보기 */}
      <div>
        <div className="mb-2 text-xs font-semibold text-sub">상단 배너 미리보기</div>
        <div
          className="relative flex aspect-[21/9] flex-col justify-end overflow-hidden rounded-xl2 p-6"
          style={
            f.bannerImageUrl
              ? { backgroundImage: `url(${f.bannerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { backgroundImage: `linear-gradient(135deg, ${f.bannerFrom}, ${f.bannerTo})` }
          }
        >
          {f.bannerImageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
          <div className={`relative text-2xl font-black ${f.bannerImageUrl ? "text-white" : "text-ink"}`}>
            {f.title || "기획전 이름"}
          </div>
          {f.subtitle && (
            <div className={`relative mt-1 text-sm font-semibold ${f.bannerImageUrl ? "text-white/85" : "text-ink/60"}`}>
              {f.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* 폼 */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">기획전 이름 *</label>
          <input className="field mt-1" value={f.title} onChange={(e) => set("title", e.target.value)} required placeholder="여름 시즌오프 특가전" />
        </div>
        <div>
          <label className="text-sm font-medium">부제</label>
          <input className="field mt-1" value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="최대 70% 할인" />
        </div>
        <ImageUploader label="상단 배너 이미지 (선택 · 없으면 색상 그라디언트)" value={f.bannerImageUrl} onChange={(url) => set("bannerImageUrl", url)} />
        <div className="flex gap-3">
          <div>
            <label className="text-xs text-sub">시작색</label>
            <input type="color" className="mt-1 h-10 w-16 rounded border border-line" value={f.bannerFrom} onChange={(e) => set("bannerFrom", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-sub">끝색</label>
            <input type="color" className="mt-1 h-10 w-16 rounded border border-line" value={f.bannerTo} onChange={(e) => set("bannerTo", e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-sub">노출 순서</label>
            <input type="number" className="field mt-1" value={f.sort} onChange={(e) => set("sort", e.target.value)} />
          </div>
        </div>
        <button className="btn-brand" disabled={pending}>
          {pending ? "생성 중…" : "기획전 만들고 상품 담기 →"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
