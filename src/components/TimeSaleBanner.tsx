"use client";

import { useEffect, useRef, useState } from "react";
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
  maxBoost,
  colorFrom,
  colorTo,
}: {
  title: string;
  state: State;
  upcomingText: string;
  liveText: string;
  startAt: string | null; // ISO
  endAt: string | null;
  maxBoost: number;
  colorFrom: string;
  colorTo: string;
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

  // 0이 되면 상태 전환을 위해 새로고침 — 단 1회만.
  // (매초 refresh하면 진행 중인 페이지 이동(본인인증 등)을 계속 취소시켜 화면이 메인으로 튕긴다)
  const refreshedRef = useRef(false);
  useEffect(() => {
    if (remain != null && remain <= 0 && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
    }
    if (remain != null && remain > 0) refreshedRef.current = false;
  }, [remain, router]);

  const live = state === "live";
  const t = remain != null ? fmt(remain) : null;
  // 진행중이면 커스텀 색상, 예정이면 다크
  const bg = live
    ? { backgroundImage: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }
    : { backgroundImage: "linear-gradient(90deg, #6E82FF, #4A60FF)" };

  return (
    <Link href="/timesale" className="block text-white" style={bg}>
      <div className="mx-auto flex max-w-shell items-center gap-3 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black tracking-wide"
          style={live ? { backgroundColor: "#fff", color: colorTo } : { backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          {live ? "LIVE" : "SOON"}
        </span>

        <span className="shrink-0 text-sm font-black tracking-tight">{title}</span>

        {maxBoost > 0 && (
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-xs font-black"
            style={live ? { backgroundColor: "#fff", color: colorTo } : { backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            수수료 +{maxBoost}%p
          </span>
        )}

        <span className="hidden text-xs font-semibold text-white/85 sm:inline">
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
