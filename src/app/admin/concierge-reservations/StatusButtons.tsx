"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReservationStatus } from "./actions";

const OPTS: { k: "reserved" | "visited" | "noshow" | "canceled"; t: string }[] = [
  { k: "reserved", t: "예약" },
  { k: "visited", t: "방문완료" },
  { k: "noshow", t: "노쇼" },
  { k: "canceled", t: "취소" },
];

export default function StatusButtons({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1">
      {OPTS.map((o) => (
        <button
          key={o.k}
          onClick={() => start(async () => { await setReservationStatus(id, o.k); router.refresh(); })}
          disabled={pending || current === o.k}
          className={`rounded px-2 py-1 text-xs ${current === o.k ? "bg-brand font-bold text-white" : "bg-brandsoft text-ink hover:bg-brand/10"} disabled:opacity-60`}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}
