"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createCategory(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { ok: false, message: "이름을 입력하세요." };

  await prisma.category.create({
    data: {
      label,
      emoji: String(formData.get("emoji") ?? "").trim() || null,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      linkUrl: String(formData.get("linkUrl") ?? "").trim() || "/category",
      sort: Number(formData.get("sort") ?? 0),
    },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, message: `카테고리 추가: ${label}` };
}

export async function updateCategory(
  id: string,
  data: { label?: string; emoji?: string | null; imageUrl?: string | null; linkUrl?: string; sort?: number }
) {
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, message: "저장되었습니다." };
}

export async function toggleCategory(id: string, active: boolean) {
  await prisma.category.update({ where: { id }, data: { active } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
