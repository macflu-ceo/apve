import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 앱 웹뷰가 최초 진입 시 ?platform=app 을 달고 오면 쿠키로 고정.
// (UA 마커를 못 붙이는 래퍼를 위한 폴백. 이후 요청은 쿠키로 앱 판별)
export function middleware(req: NextRequest) {
  // ── veca.sh 단축 도메인: veca.sh/코드 → 멀티링크(/m/코드)를 같은 주소로 서빙 ──
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (host === "veca.sh" || host === "www.veca.sh") {
    const path = req.nextUrl.pathname;
    if (path === "/") {
      // 루트는 본 사이트로
      return NextResponse.redirect("https://www.cashboutique.co.kr", 308);
    }
    if (!path.startsWith("/m/") && !path.startsWith("/api") && /^\/[a-z0-9-]+(\/f\/[a-z0-9-]+)?$/i.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = `/m${path}`;
      return NextResponse.rewrite(url);
    }
  }

  const res = NextResponse.next();
  const p = req.nextUrl.searchParams.get("platform");
  if (p === "app" || p === "web") {
    res.cookies.set("platform", p, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  // 방문자 식별 쿠키(vid)를 페이지 진입 시점에 확실히 심는다.
  // (기존엔 track fetch에서만 세팅 → keepalive/쿠키 미적용으로 매 방문이 새 사람으로 잡히던 문제 방지)
  if (!req.cookies.get("vid")) {
    res.cookies.set("vid", crypto.randomUUID(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return res;
}

// 정적 파일·API 제외한 페이지 요청에만 적용
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.).*)"],
};
