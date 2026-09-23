import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { isAdmin } from "@/lib/admin";
import { docsToken } from "@/lib/blobDocs";

export const dynamic = "force-dynamic";
// HEIC 디코딩은 시간이 걸린다 (아이폰 원본 사진 기준 수 초)
export const maxDuration = 60;

const TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  heic: "image/heic",
  heif: "image/heif",
};

// GET /api/admin/docs?path=docs/xxx/idCard-....jpg[&download=1]
// 비공개 저장소의 정산 서류를 '어드민만' 서버 경유로 열람한다. (공개 URL 미노출)
export async function GET(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const path = sp.get("path");
  const download = sp.get("download") === "1";
  if (!path || !path.startsWith("docs/") || path.includes("..")) {
    return NextResponse.json({ error: "잘못된 경로입니다." }, { status: 400 });
  }

  const token = docsToken();
  if (!token) return NextResponse.json({ error: "문서 저장소 미연결" }, { status: 503 });

  try {
    const result = await get(path, { access: "private", token });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    let type = TYPE_BY_EXT[ext] ?? result.blob?.contentType ?? "application/octet-stream";
    let body: BodyInit = result.stream as unknown as BodyInit;

    // 아이폰 기본 포맷(HEIC/HEIF)은 크롬·엣지·파이어폭스가 렌더링하지 못해 깨진 이미지로 보인다.
    // 원본을 그대로 내려주지 않고 JPEG 로 변환해 내보낸다. (원본 다운로드는 download=1)
    if ((ext === "heic" || ext === "heif") && !download) {
      const buf = Buffer.from(await new Response(result.stream as unknown as BodyInit).arrayBuffer());
      try {
        const convert = (await import("heic-convert")).default;
        const jpeg = await convert({ buffer: new Uint8Array(buf), format: "JPEG", quality: 0.9 });
        body = Buffer.from(jpeg) as unknown as BodyInit;
        type = "image/jpeg";
      } catch {
        // 변환 실패 시엔 원본을 첨부파일로 내려 로컬 뷰어로 열 수 있게 한다
        return new Response(buf as unknown as BodyInit, {
          headers: {
            "Content-Type": TYPE_BY_EXT[ext],
            "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
            "Cache-Control": "private, no-store",
          },
        });
      }
    }

    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
        ...(download ? { "Content-Disposition": `attachment; filename="${path.split("/").pop()}"` } : {}),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "열람 실패" }, { status: 500 });
  }
}
