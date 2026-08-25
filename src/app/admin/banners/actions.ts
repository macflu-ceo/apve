"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createBanner(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "제목을 입력하세요." };

  await prisma.banner.create({
    data: {
      title,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      bgFrom: String(formData.get("bgFrom") ?? "").trim() || "#E7ECFF",
      bgTo: String(formData.get("bgTo") ?? "").trim() || "#B9C6FF",
      linkUrl: String(formData.get("linkUrl") ?? "").trim() || null,
      sort: Number(formData.get("sort") ?? 0),
    },
  });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true, message: `배너 등록 완료: ${title}` };
}

export async function toggleBanner(id: string, active: boolean) {
  await prisma.banner.update({ where: { id }, data: { active } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBanner(id: string) {
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
