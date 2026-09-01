// 매일 데일리 리포트를 텔레그램으로 발송하는 크론.
// Vercel Cron이 CRON_SECRET을 Bearer로 붙여 호출. 매일 오전 9시(KST) 스케줄 권장.
import { NextResponse } from "next/server";
import { buildReport, pickPeriod } from "@/lib/report/report";
import { sendTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  // 평일=일보고 / 월요일=주보고 / 매월1일=월보고 (단위 자동 전환)
  const report = await buildReport(pickPeriod());
  const sent = await sendTelegram(report.text);
  return NextResponse.json({ ok: sent.ok, period: report.period, from: report.from, to: report.to, sent, preview: report.text });
}
