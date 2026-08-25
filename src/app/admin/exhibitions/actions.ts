"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createExhibition(input: {
  title: string;
  subtitle: string;
  bannerImageUrl: string;
  bannerFrom: string;
  bannerTo: string;
  sort: number;
}) {
  if (!input.title.trim()) return { ok: false, message: "기획전 이름을 입력하세요." };
  const ex = await prisma.exhibition.create({
    data: {
      title: input.title.trim(),
      subtitle: input.subtitle.trim() || null,
      bannerImageUrl: input.bannerImageUrl.trim() || null,
      bannerFrom: input.bannerFrom || "#E7ECFF",
      bannerTo: input.bannerTo || "#B9C6FF",
      sort: input.sort || 0,
    },
  });
  revalidatePath("/admin/exhibitions");
  return { ok: true, message: "기획전이 생성되었습니다.", id: ex.id };
}

export async function updateExhibition(
  id: string,
  data: {
    title?: string;
    subtitle?: string | null;
    bannerImageUrl?: string | null;
    bannerFrom?: string;
    bannerTo?: string;
    sort?: number;
    active?: boolean;
  }
) {
  await prisma.exhibition.update({ where: { id }, data });
  revalidatePath("/admin/exhibitions");
  revalidatePath(`/admin/exhibitions/${id}`);
  revalidatePath(`/exhibition/${id}`);
}

export async function deleteExhibition(id: string) {
  await prisma.exhibition.delete({ where: { id } });
  revalidatePath("/admin/exhibitions");
}

/** 기획전에 진열할 상품 목록을 통째로 교체 (선택 순서대로) */
export async function setExhibitionProducts(exhibitionId: string, productIds: string[]) {
  await prisma.$transaction([
    prisma.exhibitionProduct.deleteMany({ where: { exhibitionId } }),
    ...productIds.map((productId, i) =>
      prisma.exhibitionProduct.create({ data: { exhibitionId, productId, sort: i } })
    ),
  ]);
  revalidatePath(`/admin/exhibitions/${exhibitionId}`);
  revalidatePath(`/exhibition/${exhibitionId}`);
}
