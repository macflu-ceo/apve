"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type State = "off" | "upcoming" | "live";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** ms → D일 HH:MM:SS (하루 미만이면 HH:MM:SS) */
function fmt(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { d, h, m, s: sec };
}

export default function TimeSaleBanner({
  title,
  state,
  upcomingText,
  liveText,
  startAt,
  endAt,
}: {
  title: string;
  state: State;
  upcomingText: string;
  liveText: string;
  startAt: string | null; // ISO
  endAt: string | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (state === "off") return null;

  // 카운트다운 대상: live면 종료까지, upcoming이고 예약시작 있으면 시작까지
  const target =
    state === "live"
      ? endAt
        ? new Date(endAt).getTime()
        : null
      : startAt
        ? new Date(startAt).getTime()
        : null;

  const remain = now != null && target != null ? target - now : null;

  // 0이 되면 상태 전환을 위해 새로고침
  useEffect(() => {
    if (remain != null && remain <= 0) router.refresh();
  }, [remain, router]);

  const live = state === "live";
  const t = remain != null ? fmt(remain) : null;

  return (
    <Link
      href="/timesale"
      className={`block ${live ? "bg-gradient-to-r from-[#e5322f] via-[#f0453e] to-[#c81e1a]" : "bg-gradient-to-r from-[#2b2622] to-[#4a3f36]"} text-white`}
    >
      <div className="mx-auto flex max-w-shell items-center gap-3 px-4 py-2.5">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black tracking-wide ${live ? "bg-white text-[#e5322f]" : "bg-white/20 text-white"}`}>
          {live ? "LIVE" : "SOON"}
        </span>

        <span className="shrink-0 text-sm font-black tracking-tight">{title}</span>

        <span className="hidden text-xs font-semibold text-white/80 sm:inline">
          {live ? liveText : upcomingText}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {t ? (
            <>
              <span className="hidden text-[11px] font-medium text-white/70 sm:inline">
                {live ? "종료까지" : "오픈까지"}
              </span>
              <div className="flex items-center gap-0.5 font-mono text-sm font-bold tabular-nums">
                {t.d > 0 && <span className="rounded bg-black/25 px-1.5 py-0.5">{t.d}일</span>}
                <span className="rounded bg-black/25 px-1.5 py-0.5">{pad(t.h)}</span>:
                <span className="rounded bg-black/25 px-1.5 py-0.5">{pad(t.m)}</span>:
                <span className="rounded bg-black/25 px-1.5 py-0.5">{pad(t.s)}</span>
              </div>
            </>
          ) : (
            <span className="text-xs font-bold text-white/90">{live ? liveText : upcomingText}</span>
          )}
          <span className="shrink-0 text-sm font-bold">›</span>
        </div>
      </div>
    </Link>
  );
}
