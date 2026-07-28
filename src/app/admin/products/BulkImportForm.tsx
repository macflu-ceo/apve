"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importFromLinks } from "./actions";

type Result = { ok: boolean; total?: number; created?: number; updated?: number; errors?: string[]; message?: string };

export default function BulkImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  // 대략적인 개수 미리보기 (상품번호 또는 링크)
  const count = text
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => /^\d{3,20}$/.test(t) || /goodsNo=|goods_view\.php/i.test(t)).length;

  function run() {
    setResult(null);
    start(async () => {
      const r = await importFromLinks(text);
      setResult(r);
      if (r.ok) {
        router.refresh();
        if ((r.errors?.length ?? 0) === 0) setText("");
      }
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-1 text-sm font-bold">상품번호/링크 붙여넣기로 일괄 등록</div>
      <p className="mb-3 text-xs text-sub">
        <b>상품번호(goodsNo)를 여러 개</b> 붙여넣으세요. 링크도 그대로 인식합니다. (엑셀 열 복사 OK · 한 줄에 하나 · 공백/콤마 구분도 인식)
        <br />
        상품명·가격·이미지·<b>사이즈별 재고</b>는 자동으로 가져옵니다. goodsNo 기준으로 등록/갱신돼요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"1000464664\n1000466838\n1000530280\n(또는 goods_view.php?goodsNo=... 링크)"}
        className="w-full rounded-lg border border-line p-3 font-mono text-xs"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={pending || count === 0} className="btn-brand text-xs disabled:opacity-40">
          {pending ? `등록 중… (${count}개)` : count > 0 ? `${count}개 등록/갱신` : "링크를 붙여넣으세요"}
        </button>
        <a href="/api/admin/products/export" className="btn-line px-3 py-2 text-xs" download>
          ⬇ 전체 상품 엑셀 다운로드
        </a>
      </div>

      {result && (
        <div className="mt-3 rounded-lg bg-brandsoft p-3 text-sm">
          {result.ok ? (
            <>
              <b className="text-brand">완료</b> · 신규 {result.created}건 · 갱신 {result.updated}건 (총 {result.total}개)
            </>
          ) : (
            <span className="text-red-600">{result.message}</span>
          )}
          {result.errors && result.errors.length > 0 && (
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
