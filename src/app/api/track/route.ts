// 방문/클릭 수집 엔드포인트 — 클라이언트 <Tracker>와 주요 버튼에서 호출.
// 개인정보는 저장하지 않고, 익명 방문자ID·경로·종류만 기록한다.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { getOrSetVisitorId, getOrSetSessionId, kstDay } from "@/lib/visitor";
import { getPlatform } from "@/lib/platform";

export const dynamic = "force-dynamic";

const KINDS = new Set(["page", "product", "click"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      kind?: string;
      label?: string;
      goodsNo?: string;
    };

    let path = (body.path ?? "").slice(0, 300);
    if (!path || !path.startsWith("/")) return NextResponse.json({ ok: false }, { status: 204 });
    // 어드민·API·정적 경로는 집계 제외
    if (/^\/(admin|api|_next|favicon)/.test(path)) return NextResponse.json({ ok: true }, { status: 204 });
    path = path.split("?")[0];

    // 종류 판별: 명시값 우선, 없으면 경로로 추정
    let kind = body.kind && KINDS.has(body.kind) ? body.kind : "page";
    const goodsMatch = path.match(/^\/goods\/([^/]+)/);
    if (kind === "page" && goodsMatch) kind = "product";
    const goodsNo = body.goodsNo ?? goodsMatch?.[1] ?? null;

    const { visitorId } = getOrSetVisitorId();
    const { sessionId } = getOrSetSessionId();
    const partner = await getSessionPartner();

    await prisma.visit.create({
      data: {
        visitorId,
        sessionId,
        partnerId: partner?.id ?? null,
        path,
        kind,
        label: body.label ? body.label.slice(0, 40) : null,
        goodsNo,
        platform: getPlatform(),
        day: kstDay(),
      },
    });

    return NextResponse.json({ ok: true }, { status: 204 });
  } catch {
    // 집계 실패는 사용자 경험을 막지 않는다
    return NextResponse.json({ ok: false }, { status: 204 });
  }
}
