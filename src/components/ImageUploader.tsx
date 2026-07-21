"use client";

import { useRef, useState } from "react";

/** 이미지 업로드 + URL 직접입력 겸용 필드. value=현재 이미지 URL */
export default function ImageUploader({
  value,
  onChange,
  label = "이미지",
  round = false,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  round?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업로드 실패");
      onChange(data.url);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="text-xs text-sub">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        {/* 미리보기 */}
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-line bg-[#f5f4f2] ${round ? "rounded-full" : "rounded-lg"}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-sub">없음</span>
          )}
        </div>

        <div className="flex-1">
          <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="btn-line px-3 py-2 text-xs"
            >
              {busy ? "업로드 중…" : "이미지 업로드"}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="text-xs text-red-500 hover:underline">
                제거
              </button>
            )}
          </div>
          {/* URL 직접입력도 가능 */}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="또는 이미지 URL 붙여넣기"
            className="field mt-2 text-xs"
          />
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
      </div>
    </div>
  );
}
