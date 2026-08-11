"use server";

import { prisma } from "@/lib/db";
import { getConciergeViewer } from "@/lib/concierge-access";
import { parseList } from "@/lib/format";

export type CardProduct = {
  goodsNo: string;
  brand: string;
  name: string;
  listPrice: number | null;
  salePrice: number | null;
  image: string | null;
};

/** 컨시어지 전용 — 상품 검색(자동채움용). 브랜드·상품명 부분일치 */
export async function searchCardProducts(q: string): Promise<CardProduct[]> {
  const c = await getConciergeViewer();
  if (!c) return [];
  const term = q.trim();
  if (term.length < 1) return [];
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      OR: [{ name: { contains: term, mode: "insensitive" } }, { brand: { contains: term, mode: "insensitive" } }, { goodsNo: term }],
    },
    orderBy: { views: "desc" },
    take: 12,
    select: { goodsNo: true, name: true, brand: true, listPrice: true, salePrice: true, imagesJson: true },
  });
  return rows.map((p) => ({
    goodsNo: p.goodsNo,
    brand: p.brand ?? "",
    name: p.name,
    listPrice: p.listPrice,
    salePrice: p.salePrice,
    image: parseList(p.imagesJson)[0] ?? null,
  }));
}
