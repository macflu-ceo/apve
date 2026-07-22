import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";

// POST /api/upload (multipart: file) → { url }
// Vercel 위에서 실행되면 Vercel Blob(OIDC 또는 토큰)에 저장, 로컬에서는 public/uploads 에 저장.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "20MB 이하만 가능합니다." }, { status: 400 });

    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const name = `${crypto.randomUUID()}.${ext}`;

    // 운영(Vercel): Blob 저장소 사용
    // Vercel 연결 시 접두어가 소문자(blob_)로 생성되는 경우가 있어 둘 다 인식한다.
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.blob_READ_WRITE_TOKEN;
    const onVercel =
      !!process.env.VERCEL || !!blobToken || !!process.env.BLOB_STORE_ID || !!process.env.blob_STORE_ID;
    if (onVercel) {
      const blob = await put(`uploads/${name}`, file, {
        access: "public",
        contentType: file.type,
        ...(blobToken ? { token: blobToken } : {}),
      });
      return NextResponse.json({ url: blob.url });
    }

    // 로컬: public/uploads
    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "업로드 실패" }, { status: 500 });
  }
}
