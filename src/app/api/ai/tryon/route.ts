import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { generateTryOn } from "@/lib/ai/tryon";

// POST /api/ai/tryon  { goodsNo, prompt? }
// 상품 원본 이미지로 AI 착용샷을 생성해 저장하고 URL을 반환한다.
export async function POST(req: Request) {
  try {
    const { goodsNo, prompt } = await req.json();
    const product = await prisma.product.findUnique({ where: { goodsNo } });
    if (!product) return NextResponse.json({ error: "상품 없음" }, { status: 404 });

    const src = parseList(product.imagesJson)[0];
    if (!src) return NextResponse.json({ error: "원본 이미지 없음" }, { status: 400 });

    const result = await generateTryOn({
      productImageUrl: src,
      productName: product.name,
      prompt,
    });

    const saved = await prisma.tryOnImage.create({
      data: {
        productId: product.id,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        provider: result.provider,
      },
    });

    return NextResponse.json({ id: saved.id, imageUrl: saved.imageUrl, provider: result.provider });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "생성 실패" },
      { status: 500 }
    );
  }
}
