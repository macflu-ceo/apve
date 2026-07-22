"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addSearchCategory(name: string, sort: number) {
  const n = name.trim();
  if (!n) return { ok: false, message: "카테고리명을 입력하세요." };
  const dup = await prisma.searchCategory.findUnique({ where: { name: n } });
  if (dup) return { ok: false, message: "이미 있는 카테고리입니다." };
  await prisma.searchCategory.create({ data: { name: n, sort } });
  revalidatePath("/admin/search");
  return { ok: true, message: "추가되었습니다." };
}

export async function updateSearchCategory(id: string, data: { name?: string; sort?: number; active?: boolean }) {
  await prisma.searchCategory.update({ where: { id }, data });
  revalidatePath("/admin/search");
}

export async function deleteSearchCategory(id: string) {
  await prisma.searchCategory.delete({ where: { id } });
  revalidatePath("/admin/search");
}
