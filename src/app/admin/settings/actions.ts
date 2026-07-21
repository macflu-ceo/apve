"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function updateSettings(formData: FormData) {
  const interval = Math.max(1, Math.min(60, Number(formData.get("bannerInterval") ?? 3) || 3));
  const data = {
    siteName: String(formData.get("siteName") ?? "").trim() || "돈버는명품샵",
    companyName: String(formData.get("companyName") ?? "").trim() || "제이프리모인터내셔널",
    businessNo: String(formData.get("businessNo") ?? "").trim() || null,
    contact: String(formData.get("contact") ?? "").trim() || null,
    footerNote: String(formData.get("footerNote") ?? "").trim() || "이탈리아 부티크 직계약 정품 보증",
    bannerInterval: interval,
  };
  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: data,
    create: { id: "main", ...data },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "저장되었습니다." };
}
