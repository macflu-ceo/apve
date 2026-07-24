import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { getSessionPartner } from "@/lib/auth";
import { generateProductImage } from "@/lib/ai/imagegen";
import { getQuota } from "@/lib/ai/quota";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/ai/generate  { goodsNo, gender, age, background, shot }
// 회원이 상품 상세에서 AI 이미지를 생성한다.
//  · 프롬프트는 서버에서만 조립 (프론트 미노출)
//  · 생성물은 쇼핑몰에 노출되지 않으며, 회원 다운로드 + 어드민 조회용으로만 보관
//  · 하루 5장 제한, 소진 시 1시간당 1장
export async function POST(req: Request) {
  try {
    const partner = await getSessionPartner();
    if (!partner) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    // 사용량 제한 확인
    const quota = await getQuota(partner.id);
    if (!quota.canGenerate) {
      return NextResponse.json({ error: quota.message, quota }, { status: 429 });
    }

    const body = await req.json();
    const { goodsNo, gender, age, background, shot } = body ?? {};

    const product = await prisma.product.findUnique({ where: { goodsNo: String(goodsNo) } });
    if (!product) return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });

    const ref = parseList(product.imagesJson)[0];
    if (!ref) return NextResponse.json({ error: "원본 상품 이미지가 없습니다." }, { status: 400 });

    const gen = await generateProductImage(ref, product.name, product.brand, { gender, age, background, shot });
    if (!gen.ok) return NextResponse.json({ error: gen.message }, { status: 502 });

    const buf = Buffer.from(gen.base64, "base64");
    const ext = gen.mime.includes("png") ? "png" : "jpg";
    const optionSummary = [shot, gender, age, background].filter(Boolean).join(" / ");

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.blob_READ_WRITE_TOKEN;
    const onVercel = !!process.env.VERCEL || !!blobToken;

    // 로컬 개발: 저장 없이 데이터 URL 반환
    if (!onVercel) {
      return NextResponse.json({
        url: `data:${gen.mime};base64,${gen.base64}`,
        quota: await getQuota(partner.id),
      });
    }

    const blob = await put(`ai/${product.goodsNo}-${crypto.randomUUID()}.${ext}`, buf, {
      access: "public",
      contentType: gen.mime,
      ...(blobToken ? { token: blobToken } : {}),
    });

    // 생성 이력 저장 (상품 이미지로는 등록하지 않음 — 쇼핑몰 미노출)
    await prisma.tryOnImage.create({
      data: {
        productId: product.id,
        partnerId: partner.id,
        imageUrl: blob.url,
        provider: "gemini",
        prompt: optionSummary,
      },
    });

    return NextResponse.json({ url: blob.url, quota: await getQuota(partner.id) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "생성 실패" }, { status: 500 });
  }
}
