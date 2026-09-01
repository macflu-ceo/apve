import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 3600; // 1시간 캐시

/** 고도몰 등록 브랜드 목록 — 멀티링크 취향등록의 브랜드 검색용 (대소문자 중복 정리) */
export async function GET() {
  const rows = await prisma.product.findMany({
    where: { active: true, brand: { not: null } },
    distinct: ["brand"],
    select: { brand: true },
  });
  const seen = new Map<string, string>();
  for (const r of rows) {
    const b = (r.brand ?? "").trim();
    if (!b) continue;
    const key = b.toLowerCase();
    // 같은 브랜드면 'Title Case' 형태(전부 대문자가 아닌 쪽)를 우선 노출
    const cur = seen.get(key);
    if (!cur || (cur === cur.toUpperCase() && b !== b.toUpperCase())) seen.set(key, b);
  }
  const brands = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  return NextResponse.json({ brands });
}
