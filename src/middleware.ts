import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 앱 웹뷰가 최초 진입 시 ?platform=app 을 달고 오면 쿠키로 고정.
// (UA 마커를 못 붙이는 래퍼를 위한 폴백. 이후 요청은 쿠키로 앱 판별)
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const p = req.nextUrl.searchParams.get("platform");
  if (p === "app" || p === "web") {
    res.cookies.set("platform", p, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}

// 정적 파일·API 제외한 페이지 요청에만 적용
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.).*)"],
};
