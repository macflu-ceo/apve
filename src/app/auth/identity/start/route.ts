// 본인인증 시작 — 라온 브로커의 인증창으로 top-level 리다이렉트
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { brokerOrigin, type IdentityFlow } from "@/lib/identity-raon";

export const dynamic = "force-dynamic";

const FLOWS = new Set<IdentityFlow>(["signup", "find-id", "reset-pw"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flow = (url.searchParams.get("flow") || "signup") as IdentityFlow;
  const broker = brokerOrigin();

  const h = headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? "www.cashboutique.co.kr"}`;

  if (!broker || !FLOWS.has(flow)) {
    return NextResponse.redirect(`${origin}/?iv_error=${encodeURIComponent("본인인증 설정 오류")}`);
  }
  const ret = `${origin}/auth/identity/callback?flow=${flow}`;
  return NextResponse.redirect(`${broker}/start?return=${encodeURIComponent(ret)}`);
}
