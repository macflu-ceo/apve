import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { getSessionPartner } from "@/lib/auth";
import { generateProductImage } from "@/lib/ai/imagegen";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/ai/generate  { goodsNo, gender, age, background, shot, save }
// 회원이 상품 상세에서 AI 이미지를 생성한다. (프롬프트는 서버에서만 조립)
export async function POST(req: Request) {
  try {
    const partner = await getSessionPartner();
    if (!partner) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = await req.json();
    const { goodsNo, gender, age, background, shot, save } = body ?? {};

    const product = await prisma.product.findUnique({ where: { goodsNo: String(goodsNo) } });
    if (!product) return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });

    const ref = parseList(product.imagesJson)[0];
    if (!ref) return NextResponse.json({ error: "원본 상품 이미지가 없습니다." }, { status: 400 });

    const gen = await generateProductImage(ref, product.name, product.brand, { gender, age, background, shot });
    if (!gen.ok) return NextResponse.json({ error: gen.message }, { status: 502 });

    const buf = Buffer.from(gen.base64, "base64");
    const ext = gen.mime.includes("png") ? "png" : "jpg";
    const name = `ai/${product.goodsNo}-${crypto.randomUUID()}.${ext}`;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.blob_READ_WRITE_TOKEN;
    const onVercel = !!process.env.VERCEL || !!blobToken;
    if (!onVercel) {
      // 로컬 개발: base64 데이터 URL로 바로 반환
      return NextResponse.json({ url: `data:${gen.mime};base64,${gen.base64}`, saved: false });
    }

    const blob = await put(name, buf, {
      access: "public",
      contentType: gen.mime,
      ...(blobToken ? { token: blobToken } : {}),
    });

    // 생성 이력 저장
    await prisma.tryOnImage.create({
      data: {
        productId: product.id,
        imageUrl: blob.url,
        provider: "gemini",
        prompt: [gender, age, background, shot].filter(Boolean).join(" / "),
      },
    });

    // 상품 이미지로 저장(선택)
    let saved = false;
    if (save) {
      const images = parseList(product.imagesJson);
      images.push(blob.url);
      await prisma.product.update({
        where: { id: product.id },
        data: { imagesJson: JSON.stringify(images) },
      });
      saved = true;
    }

    return NextResponse.json({ url: blob.url, saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "생성 실패" }, { status: 500 });
  }
}
