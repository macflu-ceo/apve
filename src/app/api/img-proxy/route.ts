import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/img-proxy?url=<이미지 URL>
// 상품 이미지를 같은 도메인으로 우회 제공 → html2canvas가 캡처 시 CORS 오염(taint) 없이 처리.
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url)) return new NextResponse("bad url", { status: 400 });
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return new NextResponse("fetch failed", { status: 502 });
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return new NextResponse("not image", { status: 415 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}
