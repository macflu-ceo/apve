"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function revalidateAll() {
  revalidatePath("/admin/grades");
  revalidatePath("/admin/partners");
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/concierge");
}

export async function createGrade(name: string, percent: number, sort: number) {
  const n = name.trim();
  if (!n) return { ok: false, message: "등급명을 입력하세요." };
  const dup = await prisma.grade.findUnique({ where: { name: n } });
  if (dup) return { ok: false, message: "이미 있는 등급명입니다." };
  await prisma.grade.create({ data: { name: n, percent, sort } });
  revalidateAll();
  return { ok: true, message: "등급이 추가되었습니다." };
}

export async function updateGrade(id: string, data: { name?: string; percent?: number; sort?: number; isConcierge?: boolean }) {
  await prisma.grade.update({ where: { id }, data });
  revalidateAll();
  return { ok: true, message: "저장되었습니다." };
}

export async function deleteGrade(id: string) {
  const g = await prisma.grade.findUnique({ where: { id } });
  if (g?.systemKey) return { ok: false, message: "기본 등급(첫구매/일반)은 삭제할 수 없습니다." };
  // 이 등급을 쓰던 파트너는 자동 판정으로 되돌린다
  await prisma.partner.updateMany({ where: { gradeId: id }, data: { gradeId: null } });
  await prisma.grade.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "삭제되었습니다." };
}
