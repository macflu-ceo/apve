import { NextResponse } from "next/server";

// 카카오 로그인 시작점 — /signup 의 「카카오계정으로 회원가입」 버튼이 여기로 온다.
// 키가 세팅되면 kauth 인가 페이지로 보내고, 그 전에는 준비 안내를 보여준다.
export async function GET(req: Request) {
  const key = process.env.KAKAO_REST_API_KEY;
  const redirect = process.env.KAKAO_REDIRECT_URI;
  if (key && redirect) {
    const url = new URL("https://kauth.kakao.com/oauth/authorize");
    url.searchParams.set("client_id", key);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("response_type", "code");
    return NextResponse.redirect(url.toString());
  }
  // 연동 키 세팅 전 — 준비 안내 후 가입 화면으로 복귀
  const back = new URL("/signup?kakao=preparing", req.url);
  return NextResponse.redirect(back);
}
