"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "./actions";
import { toEmbedUrl } from "@/lib/embed";
import MultiImageUploader from "@/components/MultiImageUploader";

type Post = {
  id: string;
  category: string;
  title: string;
  content: string;
  videoUrl: string | null;
  images: string[];
  pinned: boolean;
};

export default function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    category: post?.category ?? "공지",
    title: post?.title ?? "",
    content: post?.content ?? "",
    videoUrl: post?.videoUrl ?? "",
    pinned: post?.pinned ?? false,
  });
  const [images, setImages] = useState<string[]>(post?.images ?? []);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const embed = toEmbedUrl(f.videoUrl);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const payload = { ...f, images };
      const res = post ? await updatePost(post.id, payload) : await createPost(payload);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        if (!post) {
          setF({ category: "공지", title: "", content: "", videoUrl: "", pinned: false });
          setImages([]);
        }
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-3">
        <div>
          <label className="text-xs text-sub">분류</label>
          <select value={f.category} onChange={(e) => set("category", e.target.value)} className="field mt-1 w-28">
            <option value="공지">공지</option>
            <option value="가이드">가이드</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-sub">제목 *</label>
          <input className="field mt-1" value={f.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="text-xs text-sub">동영상 URL (선택 · YouTube/Vimeo)</label>
        <input className="field mt-1" value={f.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtu.be/..." />
        {f.videoUrl && embed && (
          <div className="mt-2 aspect-video w-full max-w-md overflow-hidden rounded-lg">
            <iframe src={embed} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        )}
        {f.videoUrl && !embed && <p className="mt-1 text-xs text-red-600">임베드할 수 없는 URL입니다.</p>}
      </div>

      <div>
        <label className="text-xs text-sub">본문</label>
        <textarea className="field mt-1 min-h-[160px]" value={f.content} onChange={(e) => set("content", e.target.value)} placeholder="내용을 입력하세요. 줄바꿈이 그대로 반영됩니다. (이미지만 올려도 됩니다)" />
      </div>

      <div>
        <label className="text-xs text-sub">이미지 (긴 이벤트 이미지 · 여러 장 가능)</label>
        <div className="mt-1">
          <MultiImageUploader value={images} onChange={setImages} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.pinned} onChange={(e) => set("pinned", e.target.checked)} />
        상단 고정(중요)
      </label>

      <div className="flex items-center gap-3">
        <button className="btn-brand" disabled={pending}>
          {pending ? "저장 중…" : post ? "저장" : "게시글 등록"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
