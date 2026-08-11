"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MultiImageUploader from "@/components/MultiImageUploader";
import FileUploader, { type UploadedFile } from "@/components/FileUploader";
import { createConciergeNotice, updateConciergeNotice, type NoticeFile } from "./actions";

type Notice = { id: string; title: string; content: string; images: string[]; files: NoticeFile[]; pinned: boolean };

export default function NoticeForm({ notice }: { notice?: Notice }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [title, setTitle] = useState(notice?.title ?? "");
  const [content, setContent] = useState(notice?.content ?? "");
  const [images, setImages] = useState<string[]>(notice?.images ?? []);
  const [files, setFiles] = useState<UploadedFile[]>(notice?.files ?? []);
  const [pinned, setPinned] = useState(notice?.pinned ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const payload = { title, content, images, files, pinned };
      const res = notice ? await updateConciergeNotice(notice.id, payload) : await createConciergeNotice(payload);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        if (!notice) {
          setTitle("");
          setContent("");
          setImages([]);
          setFiles([]);
          setPinned(false);
        }
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs text-sub">제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="field mt-1 w-full" placeholder="공지 제목" />
      </div>
      <div>
        <label className="text-xs text-sub">내용</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="field mt-1 w-full" placeholder="공지 내용" />
      </div>
      <div>
        <label className="text-xs text-sub">본문 이미지 (선택)</label>
        <div className="mt-1"><MultiImageUploader value={images} onChange={setImages} /></div>
      </div>
      <div>
        <label className="text-xs text-sub">첨부파일 (다운로드용)</label>
        <div className="mt-1"><FileUploader files={files} onChange={setFiles} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> 상단 고정
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-ink px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "저장 중…" : notice ? "수정" : "등록"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
