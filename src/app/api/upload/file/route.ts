import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

// POST /api/upload/file (multipart: file) → { url, name, size }
// 컨시어지 공지 첨부 등 '다운로드용' 공개 파일. 이미지·PDF·오피스·한글 등 허용.
const ALLOWED = /\.(pdf|hwp|hwpx|docx?|xlsx?|pptx?|zip|png|jpe?g|webp|gif|txt|csv)$/i;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    if (!ALLOWED.test(file.name)) return NextResponse.json({ error: "허용되지 않는 형식입니다." }, { status: 400 });
    if (file.size > 30 * 1024 * 1024) return NextResponse.json({ error: "30MB 이하만 가능합니다." }, { status: 400 });

    const safe = file.name.replace(/[^\w.\-가-힣]/g, "_").slice(-80);
    const key = `${crypto.randomUUID()}-${safe}`;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.blob_READ_WRITE_TOKEN;
    const onVercel = !!process.env.VERCEL || !!blobToken || !!process.env.BLOB_STORE_ID || !!process.env.blob_STORE_ID;
    if (onVercel) {
      const blob = await put(`files/${key}`, file, {
        access: "public",
        contentType: file.type || "application/octet-stream",
        ...(blobToken ? { token: blobToken } : {}),
      });
      return NextResponse.json({ url: blob.url, name: file.name, size: file.size });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "files");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, key), bytes);
    return NextResponse.json({ url: `/files/${key}`, name: file.name, size: file.size });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "업로드 실패" }, { status: 500 });
  }
}
