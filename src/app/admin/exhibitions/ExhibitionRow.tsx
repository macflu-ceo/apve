"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateExhibition, deleteExhibition } from "./actions";
import CopyLinkButton from "@/components/CopyLinkButton";

type E = {
  id: string;
  title: string;
  subtitle: string | null;
  bannerImageUrl: string | null;
  bannerFrom: string;
  bannerTo: string;
  active: boolean;
  count: number;
};

export default function ExhibitionRow({ e }: { e: E }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="card flex items-center gap-4 p-3">
      <div
        className="h-14 w-24 shrink-0 rounded-lg bg-cover bg-center"
        style={
          e.bannerImageUrl
            ? { backgroundImage: `url(${e.bannerImageUrl})` }
            : { backgroundImage: `linear-gradient(135deg, ${e.bannerFrom}, ${e.bannerTo})` }
        }
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{e.title}</div>
        <div className="truncate text-xs text-sub">
          {e.subtitle || "부제 없음"} · 상품 {e.count}개
        </div>
      </div>
      <CopyLinkButton path={`/exhibition/${e.id}`} label="링크 복사" />
      <Link href={`/exhibition/${e.id}`} target="_blank" className="text-xs text-brand underline">
        미리보기
      </Link>
      <Link href={`/admin/exhibitions/${e.id}`} className="btn-line px-3 py-2 text-xs">
        편집·상품
      </Link>
      <button
        onClick={() => start(async () => { await updateExhibition(e.id, { active: !e.active }); router.refresh(); })}
        disabled={pending}
        className={`rounded-full px-3 py-1 text-xs font-bold ${e.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
      >
        {e.active ? "노출중" : "숨김"}
      </button>
      <button
        onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteExhibition(e.id); router.refresh(); }); }}
        disabled={pending}
        className="text-xs text-red-500 hover:underline"
      >
        삭제
      </button>
    </div>
  );
}
