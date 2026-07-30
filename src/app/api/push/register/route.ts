// 앱(웹뷰 래퍼)이 FCM 토큰을 등록/갱신하는 엔드포인트.
// 로그인 상태면 회원(partnerId)에 연결 → 세그먼트 발송 대상.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PLATFORMS = new Set(["ios", "android", "web"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { token?: string; platform?: string };
    const token = (body.token ?? "").trim();
    if (!token || token.length < 20) return NextResponse.json({ ok: false }, { status: 400 });
    const platform = PLATFORMS.has(body.platform ?? "") ? (body.platform as string) : "android";

    const partner = await getSessionPartner();
    await prisma.pushToken.upsert({
      where: { token },
      update: { platform, partnerId: partner?.id ?? null, active: true, lastSeenAt: new Date() },
      create: { token, platform, partnerId: partner?.id ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
