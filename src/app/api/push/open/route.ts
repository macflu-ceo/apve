// 푸시 열람(탭) 기록 — 알림을 눌러 열린 페이지의 <PushOpenReporter>가 호출.
// 발송 1건당 방문자별 1회만 집계(고유 인원). 첫 열람 시 PushLog.opened +1.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrSetVisitorId } from "@/lib/visitor";
import { getSessionPartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pushId } = (await req.json().catch(() => ({}))) as { pushId?: string };
    if (!pushId) return NextResponse.json({ ok: false }, { status: 204 });

    // 열람자 식별: 로그인 회원이면 회원ID, 아니면 익명 방문자ID
    const partner = await getSessionPartner();
    const { visitorId } = getOrSetVisitorId();
    const who = partner?.id ?? visitorId;
    if (!who) return NextResponse.json({ ok: false }, { status: 204 });

    // 고유 열람만 카운트 (중복은 unique 제약으로 무시)
    await prisma.pushOpen.create({ data: { pushLogId: pushId, visitorId: who } });
    await prisma.pushLog.update({ where: { id: pushId }, data: { opened: { increment: 1 } } });
    return NextResponse.json({ ok: true }, { status: 204 });
  } catch {
    // 중복 열람(unique 위반) 또는 없는 pushId → 조용히 무시
    return NextResponse.json({ ok: true }, { status: 204 });
  }
}
