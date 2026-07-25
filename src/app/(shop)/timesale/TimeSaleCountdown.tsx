"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function TimeSaleCountdown({
  state,
  startAt,
  endAt,
}: {
  state: "off" | "upcoming" | "live";
  startAt: string | null;
  endAt: string | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target =
    state === "live" ? (endAt ? new Date(endAt).getTime() : null) : startAt ? new Date(startAt).getTime() : null;
  const remain = now != null && target != null ? target - now : null;

  useEffect(() => {
    if (remain != null && remain <= 0) router.refresh();
  }, [remain, router]);

  if (remain == null) {
    return <div className="text-sm font-semibold text-white/80">{state === "live" ? "진행 중" : "오픈 예정"}</div>;
  }

  const s = Math.max(0, Math.floor(remain / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const Box = ({ v, unit }: { v: string; unit: string }) => (
    <div className="flex flex-col items-center">
      <span className="min-w-[2.4ch] rounded-lg bg-black/30 px-2 py-1.5 font-mono text-xl font-black tabular-nums">
        {v}
      </span>
      <span className="mt-1 text-[10px] text-white/70">{unit}</span>
    </div>
  );

  return (
    <div>
      <div className="text-xs font-semibold text-white/70">{state === "live" ? "종료까지" : "오픈까지"}</div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        {d > 0 && <Box v={String(d)} unit="일" />}
        <Box v={pad(h)} unit="시" />
        <Box v={pad(m)} unit="분" />
        <Box v={pad(sec)} unit="초" />
      </div>
    </div>
  );
}
