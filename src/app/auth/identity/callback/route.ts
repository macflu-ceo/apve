// 본인인증 콜백 — 브로커가 ?code=… 로 복귀시키면 서버-서버로 결과 수령 후
// 서명 쿠키(iv_ticket)에 저장하고 흐름별 페이지로 리다이렉트.
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { fetchBrokerResult, setIdentityTicket, type IdentityFlow } from "@/lib/identity-raon";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const flow = (url.searchParams.get("flow") || "signup") as IdentityFlow;

  const h = headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? "www.cashboutique.co.kr"}`;

  const fail = (msg: string) => {
    const dest = flow === "signup" ? `/?signup=1&iv_error=` : `/account/recover?tab=${flow}&iv_error=`;
    return NextResponse.redirect(`${origin}${dest}${encodeURIComponent(msg)}`);
  };

  if (!code) return fail("본인인증이 취소되었거나 실패했습니다.");

  const r = await fetchBrokerResult(code);
  if (!r.ok) return fail(r.message);

  setIdentityTicket({ ci: r.ci, di: r.di, name: r.name, phone: r.phone, flow });

  const dest =
    flow === "signup"
      ? "/?signup=1&iv=1"
      : flow === "find-id"
        ? "/account/recover?tab=find-id&iv=1"
        : "/account/recover?tab=reset-pw&iv=1";
  return NextResponse.redirect(`${origin}${dest}`);
}
