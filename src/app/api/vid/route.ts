import { NextRequest, NextResponse } from "next/server";

// 앱 전용: localStorage에 보관된 고정 기기 ID로 vid 쿠키를 복원한다.
// (앱 웹뷰는 쿠키가 재시작·재설치에서 날아가 매번 새 방문자로 집계되는 문제 방지)
export async function POST(req: NextRequest) {
  let vid: unknown;
  try {
    ({ vid } = await req.json());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof vid !== "string" || !/^[0-9a-f-]{36}$/i.test(vid)) {
    return new NextResponse(null, { status: 400 });
  }
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set("vid", vid, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });
  return res;
}
