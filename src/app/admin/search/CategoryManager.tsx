"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSearchCategory, updateSearchCategory, deleteSearchCategory } from "./actions";

type C = { id: string; name: string; sort: number; active: boolean };

export default function CategoryManager({ categories }: { categories: C[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await addSearchCategory(name, categories.length);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setName("");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-2">
        <input
          className="field w-48"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="카테고리명 (예: 크로스백)"
          required
        />
        <button className="btn-brand" disabled={pending}>추가</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </form>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
              c.active ? "border-line bg-white" : "border-line bg-[#f5f5f5] text-sub line-through"
            }`}
          >
            {c.name}
            <button
              onClick={() => start(async () => { await updateSearchCategory(c.id, { active: !c.active }); router.refresh(); })}
              className="text-xs text-sub hover:text-ink"
              title={c.active ? "숨기기" : "노출"}
            >
              {c.active ? "숨김" : "노출"}
            </button>
            <button
              onClick={() => { if (confirm(`'${c.name}' 삭제할까요?`)) start(async () => { await deleteSearchCategory(c.id); router.refresh(); }); }}
              className="text-xs text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
