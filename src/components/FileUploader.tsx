"use client";

import { useRef, useState } from "react";

export type UploadedFile = { name: string; url: string; size: number };

function fmtSize(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

/** 다운로드용 첨부파일 업로더 — /api/upload/file 로 올리고 {name,url,size} 수집 */
export default function FileUploader({ files, onChange }: { files: UploadedFile[]; onChange: (f: UploadedFile[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setErr("");
    const added: UploadedFile[] = [];
    for (const file of Array.from(list)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) added.push({ name: data.name, url: data.url, size: data.size });
      else setErr(data.error || "업로드 실패");
    }
    onChange([...files, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => pick(e.target.files)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="btn-line px-3 py-2 text-sm disabled:opacity-50"
      >
        {busy ? "업로드 중…" : "+ 파일 첨부"}
      </button>
      {err && <span className="ml-2 text-xs text-red-500">{err}</span>}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-brandsoft px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">📎 {f.name}</span>
              <span className="shrink-0 text-xs text-sub">{fmtSize(f.size)}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="shrink-0 text-xs text-red-500 hover:underline"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
