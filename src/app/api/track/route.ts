// 방문/클릭 수집 엔드포인트 — 클라이언트 <Tracker>와 주요 버튼에서 호출.
// 개인정보는 저장하지 않고, 익명 방문자ID·경로·종류만 기록한다.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { getOrSetVisitorId, getOrSetSessionId, kstDay } from "@/lib/visitor";
import { getPlatform } from "@/lib/platform";

export const dynamic = "force-dynamic";

const KINDS = new Set(["page", "product", "click", "impression"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      kind?: string;
      label?: string;
      goodsNo?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
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
    const { sessionId, isNewSession } = getOrSetSessionId();
    const partner = await getSessionPartner();

    // 유입 경로/UTM 은 세션 첫 진입에만 기록(획득 소스 1회 귀속)
    let referrer: string | null = null;
    let utmSource: string | null = null;
    let utmMedium: string | null = null;
    let utmCampaign: string | null = null;
    if (isNewSession) {
      const rawRef = body.referrer || req.headers.get("referer") || "";
      const selfHost = req.headers.get("host") ?? "";
      try {
        const h = rawRef ? new URL(rawRef).host : "";
        if (h && h !== selfHost) referrer = h.replace(/^www\./, "").slice(0, 80);
      } catch {
        /* 유효하지 않은 리퍼러 무시 */
      }
      const clip = (v?: string) => (v ? v.slice(0, 60) : null);
      utmSource = clip(body.utmSource);
      utmMedium = clip(body.utmMedium);
      utmCampaign = clip(body.utmCampaign);
    }

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
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        day: kstDay(),
      },
    });

    return NextResponse.json({ ok: true }, { status: 204 });
  } catch {
    // 집계 실패는 사용자 경험을 막지 않는다
    return NextResponse.json({ ok: false }, { status: 204 });
  }
}
