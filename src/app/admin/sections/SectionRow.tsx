"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateSection, deleteSection } from "./actions";

type S = {
  id: string;
  title: string;
  subtitle: string | null;
  sort: number;
  active: boolean;
  count: number;
};

export default function SectionRow({ s }: { s: S }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{s.title}</div>
        <div className="truncate text-xs text-sub">
          {s.subtitle || "부제 없음"} · 상품 {s.count}개 · 순서 {s.sort}
        </div>
      </div>
      <Link href={`/admin/sections/${s.id}`} className="btn-line px-3 py-2 text-xs">
        상품 배치
      </Link>
      <button
        onClick={() => start(async () => { await updateSection(s.id, { active: !s.active }); router.refresh(); })}
        disabled={pending}
        className={`rounded-full px-3 py-1 text-xs font-bold ${s.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
      >
        {s.active ? "노출중" : "숨김"}
      </button>
      <button
        onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteSection(s.id); router.refresh(); }); }}
        disabled={pending}
        className="text-xs text-red-500 hover:underline"
      >
        삭제
      </button>
    </div>
  );
}
