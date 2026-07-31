"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { createCommunityPost } from "../actions";

export default function NewPostForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [category, setCategory] = useState<string>(COMMUNITY_CATEGORIES[0].key);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([""]);

  function setImage(i: number, url: string) {
    setImages((prev) => {
      const next = [...prev];
      next[i] = url;
      // 마지막 칸을 채우면 새 빈 칸 추가 (최대 4)
      if (url && i === next.length - 1 && next.length < 4) next.push("");
      return next;
    });
  }

  function submit() {
    setMsg(null);
    start(async () => {
      const r = await createCommunityPost({
        category,
        title,
        content,
        images: images.filter(Boolean),
      });
      if (r.ok) router.push(`/community/${r.id}`);
      else setMsg(r.message);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">카테고리</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {COMMUNITY_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                category === c.key ? "border-brand bg-brand text-white" : "border-line text-ink/70"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <input className="field w-full" placeholder="제목" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="field h-40 w-full resize-none" placeholder="내용을 입력하세요" value={content} onChange={(e) => setContent(e.target.value)} />

      <div>
        <label className="text-sm font-medium">사진 (선택, 최대 4장)</label>
        <div className="mt-1 space-y-3">
          {images.map((img, i) => (
            <div key={i} className="max-w-md">
              <ImageUploader value={img} onChange={(u) => setImage(i, u)} label={`사진 ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="btn-brand px-6">
          {pending ? "등록 중…" : "등록"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-line px-4">취소</button>
      </div>
    </div>
  );
}
