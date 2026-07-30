// 온보딩 슬라이드 조회 (첫 방문 오버레이가 클라이언트에서 필요할 때만 호출 → 페이지마다 DB조회 방지)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slides = await prisma.onboardingSlide.findMany({
      where: { active: true },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      select: { id: true, imageUrl: true, caption: true },
    });
    return NextResponse.json({ slides });
  } catch {
    return NextResponse.json({ slides: [] });
  }
}
