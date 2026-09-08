import { NextResponse } from "next/server";
import { fetchProfileWithToken, kakaoSignInOrUp } from "@/lib/kakao-auth";

// 앱(네이티브 카카오톡 로그인)이 받아온 액세스 토큰으로 가입/로그인 처리.
// 토큰은 서버가 kapi에 직접 조회해 검증하므로 위조 토큰으로는 통과할 수 없다.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let accessToken = "";
  try {
    const body = await req.json();
    accessToken = String(body?.accessToken ?? "");
  } catch {
    /* noop */
  }
  if (!accessToken) return NextResponse.json({ ok: false, reason: "error" }, { status: 400 });

  try {
    const profile = await fetchProfileWithToken(accessToken);
    const r = await kakaoSignInOrUp(profile);
    if (!r.ok) return NextResponse.json({ ok: false, reason: r.reason }, { status: 403 });
    return NextResponse.json({ ok: true, created: r.created });
  } catch (e) {
    console.error("[kakao token login]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
