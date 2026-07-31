"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, toggleCategory, deleteCategory } from "./actions";

type Cat = { id: string; key: string; label: string; active: boolean };

export default function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.message);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-1 text-sm font-bold">카테고리</div>
      <p className="mb-3 text-xs text-sub">커뮤니티 상단 탭. <b>숨김</b>하면 사용자에게 안 보여요. (지금은 판매 노하우만 노출)</p>

      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <div key={c.id} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${c.active ? "border-brand bg-brandsoft" : "border-line text-sub"}`}>
            <span className="font-semibold">{c.label}</span>
            <button disabled={pending} onClick={() => run(() => toggleCategory(c.id, !c.active))} className="text-xs text-ink/60 hover:text-ink">
              {c.active ? "숨김" : "노출"}
            </button>
            <button disabled={pending} onClick={() => { if (confirm(`'${c.label}' 삭제?`)) run(() => deleteCategory(c.id)); }} className="text-xs text-red-500 hover:underline">
              삭제
            </button>
          </div>
        ))}
        {categories.length === 0 && <span className="text-sm text-sub">카테고리가 없습니다.</span>}
      </div>

      <div className="flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="새 카테고리명 (예: 자유수다)" className="field w-56" />
        <button disabled={pending || !label.trim()} onClick={() => run(() => createCategory(label), () => setLabel(""))} className="btn-brand px-4">
          추가
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
    </div>
  );
}
