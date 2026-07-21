"use client";

import { useRef, useState } from "react";

/** 여러 이미지 업로드 (긴 이벤트 이미지 포함) — 순서변경·삭제, value=URL 배열 */
export default function MultiImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    const added: string[] = [];
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.set("file", f);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "업로드 실패");
        added.push(data.url);
      } catch (e2) {
        setErr(e2 instanceof Error ? e2.message : "업로드 실패");
      }
    }
    onChange([...value, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, k) => k !== i));

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-line px-3 py-2 text-xs">
        {busy ? "업로드 중…" : "＋ 이미지 추가 (여러 장 가능)"}
      </button>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((url, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs text-sub">{url}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-line px-2 py-1 text-xs disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded border border-line px-2 py-1 text-xs disabled:opacity-30">↓</button>
              <button type="button" onClick={() => remove(i)} className="text-xs text-red-500 hover:underline">삭제</button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-sub">순서대로 상세에서 풀폭으로 노출됩니다. 긴 이벤트 이미지는 한 장만 올려도 됩니다.</p>
    </div>
  );
}
