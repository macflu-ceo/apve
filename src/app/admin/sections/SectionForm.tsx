"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSection } from "./actions";

export default function SectionForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createSection(fd);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1">
        <label className="text-xs text-sub">섹션 제목 *</label>
        <input name="title" required className="field mt-1" placeholder="관심 가질 만한 상품" />
      </div>
      <div className="flex-1">
        <label className="text-xs text-sub">부제 (선택)</label>
        <input name="subtitle" className="field mt-1" placeholder="엄선한 명품 셀렉션이에요" />
      </div>
      <div>
        <label className="text-xs text-sub">순서</label>
        <input name="sort" type="number" defaultValue={0} className="field mt-1 w-20" />
      </div>
      <button className="btn-brand" disabled={pending}>
        {pending ? "추가 중…" : "섹션 추가"}
      </button>
      {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
    </form>
  );
}
