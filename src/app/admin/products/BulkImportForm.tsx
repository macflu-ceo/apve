"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = { created: number; updated: number; total: number; errors: string[] };

export default function BulkImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/admin/products/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업로드 실패");
      setResult(data);
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "업로드 실패");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-1 text-sm font-bold">엑셀로 일괄 등록</div>
      <p className="mb-3 text-xs text-sub">
        양식(엑셀)을 내려받아 <b>A열부터 순서대로</b> 채운 뒤 업로드하세요. 컬럼: 상품링크 · 상품명 · 브랜드 · 카테고리 · 사이즈 · 재고 ·
        리테일가격 · 공급가 · 이미지URL · 원산지 · 태그. (상품링크의 goodsNo 기준으로 등록/갱신)
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <a href="/api/admin/products/template" className="btn-line px-3 py-2 text-xs" download>
          ⬇ 예시 양식 다운로드
        </a>
        <a href="/api/admin/products/export" className="btn-line px-3 py-2 text-xs" download>
          ⬇ 전체 상품 엑셀 다운로드
        </a>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="btn-brand text-xs">
          {busy ? "처리 중…" : "엑셀 파일 업로드"}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {result && (
        <div className="mt-3 rounded-lg bg-brandsoft p-3 text-sm">
          <b className="text-brand">완료</b> · 신규 {result.created}건 · 갱신 {result.updated}건 (총 {result.total}행)
          {result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-red-600">
              {result.errors.slice(0, 8).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {result.errors.length > 8 && <li>…외 {result.errors.length - 8}건</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
