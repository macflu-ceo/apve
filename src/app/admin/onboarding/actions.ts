"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

function revalidate() {
  revalidatePath("/admin/onboarding");
}

export async function createSlide(input: { imageUrl: string; caption: string }) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  if (!input.imageUrl.trim()) return { ok: false, message: "이미지를 등록하세요." };
  const count = await prisma.onboardingSlide.count();
  await prisma.onboardingSlide.create({
    data: { imageUrl: input.imageUrl.trim(), caption: input.caption.trim() || null, sort: count },
  });
  revalidate();
  return { ok: true, message: "슬라이드가 추가되었습니다." };
}

export async function updateSlide(
  id: string,
  input: { caption: string; active: boolean; sort: number }
) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.onboardingSlide.update({
    where: { id },
    data: { caption: input.caption.trim() || null, active: input.active, sort: input.sort },
  });
  revalidate();
  return { ok: true, message: "저장되었습니다." };
}

export async function deleteSlide(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.onboardingSlide.delete({ where: { id } });
  revalidate();
  return { ok: true, message: "삭제되었습니다." };
}
