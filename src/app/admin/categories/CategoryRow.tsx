"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCategory, deleteCategory, updateCategory } from "./actions";

type C = {
  id: string;
  label: string;
  emoji: string | null;
  imageUrl: string | null;
  linkUrl: string;
  sort: number;
  active: boolean;
};

export default function CategoryRow({ c, exhibitions }: { c: C; exhibitions: { id: string; title: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [link, setLink] = useState(c.linkUrl);
  const [saved, setSaved] = useState(false);

  function save() {
    start(async () => {
      await updateCategory(c.id, { linkUrl: link });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brandsoft text-base font-black text-brand">
          {c.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            c.emoji || c.label[0]
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{c.label}</div>
          <div className="text-xs text-sub">순서 {c.sort}</div>
        </div>
        <button
          onClick={() => start(async () => { await toggleCategory(c.id, !c.active); router.refresh(); })}
          disabled={pending}
          className={`rounded-full px-3 py-1 text-xs font-bold ${c.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
        >
          {c.active ? "노출중" : "숨김"}
        </button>
        <button
          onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteCategory(c.id); router.refresh(); }); }}
          disabled={pending}
          className="text-xs text-red-500 hover:underline"
        >
          삭제
        </button>
      </div>

      {/* 클릭 링크 설정 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="text-xs font-semibold text-sub">클릭 시 이동</span>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/category 또는 /exhibition/…"
          className="w-64 rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <select
          onChange={(e) => e.target.value && setLink(e.target.value)}
          value=""
          className="rounded-md border border-line px-2 py-1.5 text-sm"
        >
          <option value="">기획전 선택…</option>
          {exhibitions.map((ex) => (
            <option key={ex.id} value={`/exhibition/${ex.id}`}>{ex.title}</option>
          ))}
        </select>
        <button onClick={save} disabled={pending} className="btn-brand px-3 py-1.5 text-xs">
          {saved ? "저장됨 ✓" : "링크 저장"}
        </button>
      </div>
    </div>
  );
}
