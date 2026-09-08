import { NextResponse } from "next/server";
import { exchangeAndFetchProfile, kakaoSignInOrUp } from "@/lib/kakao-auth";

// 카카오 로그인 콜백 — 인가 코드로 프로필을 받아 가입/로그인 처리
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (err || !code) return to("/signup?kakao=cancelled");
  try {
    const profile = await exchangeAndFetchProfile(code);
    const r = await kakaoSignInOrUp(profile);
    if (!r.ok) return to(r.reason === "age" ? "/signup?kakao=age" : "/signup?kakao=blocked");
    return to(r.created ? "/?welcome=1" : "/");
  } catch (e) {
    console.error("[kakao callback]", e instanceof Error ? e.message : e);
    return to("/signup?kakao=error");
  }
}
