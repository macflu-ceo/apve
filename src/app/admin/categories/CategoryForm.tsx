"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "./actions";
import ImageUploader from "@/components/ImageUploader";

export default function CategoryForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ label: "", emoji: "", imageUrl: "", linkUrl: "/category", sort: "0" });

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.set(k, v));
    start(async () => {
      const res = await createCategory(fd);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setF({ label: "", emoji: "", imageUrl: "", linkUrl: "/category", sort: "0" });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      {/* 미리보기 칩 */}
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brandsoft text-lg font-black text-brand">
          {f.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            f.emoji || (f.label[0] ?? "?")
          )}
        </span>
        <span className="text-xs text-sub">{f.label || "미리보기"}</span>
      </div>

      <div>
        <label className="text-xs text-sub">이름 *</label>
        <input className="field mt-1 w-32" value={f.label} onChange={(e) => set("label", e.target.value)} required placeholder="가방" />
      </div>
      <div>
        <label className="text-xs text-sub">이모지</label>
        <input className="field mt-1 w-20" value={f.emoji} onChange={(e) => set("emoji", e.target.value)} placeholder="👜" />
      </div>
      <div className="w-72">
        <ImageUploader label="이미지 (선택)" round value={f.imageUrl} onChange={(url) => set("imageUrl", url)} />
      </div>
      <div>
        <label className="text-xs text-sub">링크</label>
        <input className="field mt-1 w-40" value={f.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-sub">순서</label>
        <input type="number" className="field mt-1 w-20" value={f.sort} onChange={(e) => set("sort", e.target.value)} />
      </div>
      <button className="btn-brand" disabled={pending}>
        {pending ? "추가 중…" : "추가"}
      </button>
      {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
    </form>
  );
}
