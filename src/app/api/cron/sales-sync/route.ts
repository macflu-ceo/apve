// 판매내역 자동 동기화 크론 — 최근 14일 창을 매일 갱신 (취소/확정 상태 변화 반영)
import { NextResponse } from "next/server";
import { syncConciergeSales } from "@/lib/godomall/sales";
import { ensureGodoAgents } from "@/lib/godomall/agent";
import { alertError } from "@/lib/report/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function kstDate(offsetDays = 0): string {
  return new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const agents = await ensureGodoAgents().catch(() => null); // 영업사원 등록 보정(멱등)
    const r = await syncConciergeSales(kstDate(-14), kstDate(0));
    return NextResponse.json({ ok: true, ...r, agents });
  } catch (e) {
    await alertError("판매동기화", e); // 장애 신호 실시간 알림
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "sync failed" }, { status: 500 });
  }
}
