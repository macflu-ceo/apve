import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { getSessionPartner } from "@/lib/auth";
import { docsToken } from "@/lib/blobDocs";

export const dynamic = "force-dynamic";

// POST /api/upload/doc (multipart: file, kind=idCard|bankbook) → { path }
// 신분증/통장 사본은 '비공개' 저장소에 저장하고, 공개 URL이 아닌 경로만 반환한다.
export async function POST(req: Request) {
  try {
    const partner = await getSessionPartner();
    if (!partner) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const token = docsToken();
    if (!token) {
      return NextResponse.json(
        { error: "문서 저장소가 아직 연결되지 않았습니다. 관리자에게 문의해주세요." },
        { status: 503 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "doc");
    if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    if (!/^image\/|^application\/pdf$/.test(file.type))
      return NextResponse.json({ error: "이미지 또는 PDF만 업로드할 수 있습니다." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "10MB 이하만 가능합니다." }, { status: 400 });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const pathname = `docs/${partner.id}/${kind}-${crypto.randomUUID()}.${ext}`;

    const blob = await put(pathname, file, {
      access: "private",
      token,
      contentType: file.type,
    });

    // 공개 URL을 노출하지 않고 경로만 저장/반환 (열람은 어드민 전용 프록시로)
    return NextResponse.json({ path: blob.pathname });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "업로드 실패" }, { status: 500 });
  }
}
