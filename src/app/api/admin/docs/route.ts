import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { isAdmin } from "@/lib/admin";
import { docsToken } from "@/lib/blobDocs";

export const dynamic = "force-dynamic";

// GET /api/admin/docs?path=docs/xxx/idCard-....jpg
// 비공개 저장소의 정산 서류를 '어드민만' 서버 경유로 열람한다. (공개 URL 미노출)
export async function GET(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const path = new URL(req.url).searchParams.get("path");
  if (!path || !path.startsWith("docs/")) {
    return NextResponse.json({ error: "잘못된 경로입니다." }, { status: 400 });
  }

  const token = docsToken();
  if (!token) return NextResponse.json({ error: "문서 저장소 미연결" }, { status: 503 });

  try {
    const result = await get(path, { access: "private", token });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const type =
      ext === "pdf" ? "application/pdf"
      : ext === "png" ? "image/png"
      : ext === "webp" ? "image/webp"
      : "image/jpeg";

    return new Response(result.stream as unknown as BodyInit, {
      headers: { "Content-Type": type, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "열람 실패" }, { status: 500 });
  }
}
