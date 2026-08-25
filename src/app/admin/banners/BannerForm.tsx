"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBanner } from "./actions";
import ImageUploader from "@/components/ImageUploader";

export default function BannerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    title: "이탈리아 부티크 직수입",
    subtitle: "정가 대비 최대 70% 특가",
    imageUrl: "",
    bgFrom: "#E7ECFF",
    bgTo: "#B9C6FF",
    linkUrl: "",
    sort: "0",
  });

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.set(k, v));
    startTransition(async () => {
      const res = await createBanner(fd);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* 미리보기 */}
      <div>
        <div className="mb-2 text-xs font-semibold text-sub">미리보기 (홈과 동일 · 정사각형)</div>
        <div
          className="relative mx-auto flex aspect-square w-full max-w-[340px] flex-col justify-end overflow-hidden rounded-xl2 p-6"
          style={
            f.imageUrl
              ? { backgroundImage: `url(${f.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { backgroundImage: `linear-gradient(135deg, ${f.bgFrom}, ${f.bgTo})` }
          }
        >
          <div className="text-2xl font-black text-ink">{f.title || "제목"}</div>
          <div className="mt-1 text-sm font-semibold text-ink/60">{f.subtitle}</div>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium">제목 *</label>
          <input className="field mt-1" value={f.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">부제</label>
          <input className="field mt-1" value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </div>
        <ImageUploader
          label="배경 이미지 (선택 · 없으면 색상 그라디언트)"
          value={f.imageUrl}
          onChange={(url) => set("imageUrl", url)}
        />
        <div className="flex gap-3">
          <div>
            <label className="text-sm font-medium">시작색</label>
            <input type="color" className="mt-1 h-10 w-16 rounded border border-line" value={f.bgFrom} onChange={(e) => set("bgFrom", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">끝색</label>
            <input type="color" className="mt-1 h-10 w-16 rounded border border-line" value={f.bgTo} onChange={(e) => set("bgTo", e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">노출 순서</label>
            <input type="number" className="field mt-1" value={f.sort} onChange={(e) => set("sort", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">클릭 링크 (선택)</label>
          <input className="field mt-1" value={f.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="/category 또는 https://…" />
        </div>
        <button className="btn-brand" disabled={pending}>
          {pending ? "등록 중…" : "배너 등록"}
        </button>
        {msg && <span className={`ml-3 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </form>
    </div>
  );
}
