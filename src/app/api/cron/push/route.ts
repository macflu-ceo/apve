// 예약 푸시 발송 크론 — 매분 실행, 발송 시각이 된 대기건을 처리.
// Vercel Cron이 CRON_SECRET 을 Authorization 헤더로 붙여 호출한다.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToSegment, type PushSegment } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 크론 인증 (CRON_SECRET 설정 시 Vercel이 Bearer 로 전달)
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.scheduledPush.findMany({
    where: { status: "pending", sendAt: { lte: now } },
    orderBy: { sendAt: "asc" },
    take: 20,
  });

  let processed = 0;
  for (const p of due) {
    try {
      const seg: PushSegment = p.segment === "members" || p.segment === "guests" ? p.segment : "all";
      const res = await sendPushToSegment(
        seg,
        { title: p.title, body: p.body, url: p.url ?? undefined, imageUrl: p.imageUrl ?? undefined },
        "scheduled"
      );
      await prisma.scheduledPush.update({
        where: { id: p.id },
        data: { status: "sent", sentAt: new Date(), target: res.target, sent: res.sent, failed: res.failed },
      });
      processed++;
    } catch {
      await prisma.scheduledPush.update({ where: { id: p.id }, data: { status: "failed" } }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, processed });
}
