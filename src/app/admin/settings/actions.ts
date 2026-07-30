"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function updateSettings(formData: FormData) {
  const interval = Math.max(1, Math.min(60, Number(formData.get("bannerInterval") ?? 3) || 3));
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };
  const data = {
    siteName: String(formData.get("siteName") ?? "").trim() || "돈버는명품샵",
    companyName: String(formData.get("companyName") ?? "").trim() || "제이프리모인터내셔널",
    businessNo: str("businessNo"),
    footerNote: String(formData.get("footerNote") ?? "").trim() || "이탈리아 부티크 직계약 정품 보증",
    bannerInterval: interval,
    ceo: str("ceo"),
    mailOrderNo: str("mailOrderNo"),
    address: str("address"),
    csPhone: str("csPhone"),
    email: str("email"),
    privacyOfficer: str("privacyOfficer"),
    privacyEmail: str("privacyEmail"),
    ogImage: str("ogImage"),
    appIosUrl: str("appIosUrl"),
    appAndroidUrl: str("appAndroidUrl"),
    appLandingUrl: str("appLandingUrl"),
    appBoostPercent: Math.max(0, Math.min(50, Number(formData.get("appBoostPercent") ?? 0) || 0)),
    webDailyCodeLimit: Math.max(0, Math.min(999, Number(formData.get("webDailyCodeLimit") ?? 3) || 0)),
    appSplashUrl: str("appSplashUrl"),
    offlineTitle: str("offlineTitle"),
    offlineMessage: str("offlineMessage"),
    pushOnSale: formData.get("pushOnSale") === "on",
  };
  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: data,
    create: { id: "main", ...data },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "저장되었습니다." };
}
