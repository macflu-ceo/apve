"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBanner, deleteBanner } from "./actions";

type B = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  bgFrom: string;
  bgTo: string;
  sort: number;
  active: boolean;
};

export default function BannerRow({ banner }: { banner: B }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="card flex items-center gap-4 p-3">
      <div
        className="h-14 w-28 shrink-0 rounded-lg bg-cover bg-center"
        style={
          banner.imageUrl
            ? { backgroundImage: `url(${banner.imageUrl})` }
            : { backgroundImage: `linear-gradient(135deg, ${banner.bgFrom}, ${banner.bgTo})` }
        }
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{banner.title}</div>
        <div className="truncate text-xs text-sub">{banner.subtitle}</div>
        <div className="text-xs text-sub">순서 {banner.sort}</div>
      </div>
      <button
        onClick={() => start(async () => { await toggleBanner(banner.id, !banner.active); router.refresh(); })}
        disabled={pending}
        className={`rounded-full px-3 py-1 text-xs font-bold ${banner.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
      >
        {banner.active ? "노출중" : "숨김"}
      </button>
      <button
        onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteBanner(banner.id); router.refresh(); }); }}
        disabled={pending}
        className="text-xs text-red-500 hover:underline"
      >
        삭제
      </button>
    </div>
  );
}
