"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createSection(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "섹션 제목을 입력하세요." };
  await prisma.section.create({
    data: {
      title,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      sort: Number(formData.get("sort") ?? 0),
    },
  });
  revalidatePath("/admin/sections");
  revalidatePath("/");
  return { ok: true, message: `섹션 추가: ${title}` };
}

export async function updateSection(id: string, data: { title?: string; subtitle?: string | null; sort?: number; active?: boolean }) {
  await prisma.section.update({ where: { id }, data });
  revalidatePath("/admin/sections");
  revalidatePath(`/admin/sections/${id}`);
  revalidatePath("/");
}

export async function deleteSection(id: string) {
  await prisma.section.delete({ where: { id } });
  revalidatePath("/admin/sections");
  revalidatePath("/");
}

/** 섹션에 진열할 상품 목록을 통째로 교체 (선택 순서대로 정렬) */
export async function setSectionProducts(sectionId: string, productIds: string[]) {
  await prisma.$transaction([
    prisma.sectionProduct.deleteMany({ where: { sectionId } }),
    ...productIds.map((productId, i) =>
      prisma.sectionProduct.create({ data: { sectionId, productId, sort: i } })
    ),
  ]);
  revalidatePath(`/admin/sections/${sectionId}`);
  revalidatePath("/admin/sections");
  revalidatePath("/");
}
