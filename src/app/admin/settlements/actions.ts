"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

/** 파트너의 미정산(구매확정·미지급) 수수료를 지급 완료 처리 */
export async function markPartnerPaid(partnerId: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const now = new Date();
  const res = await prisma.sale.updateMany({
    where: { partnerId, status: "confirmed", paidOut: false },
    data: { paidOut: true, paidOutAt: now },
  });
  revalidatePath("/admin/settlements");
  return { ok: true, message: `${res.count}건 지급 완료 처리`, count: res.count };
}

/** 지급 완료 이력 되돌리기 (같은 파트너·같은 지급시각 배치) */
export async function revertPayout(partnerId: string, paidOutAtISO: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const at = new Date(paidOutAtISO);
  const res = await prisma.sale.updateMany({
    where: { partnerId, paidOut: true, paidOutAt: at },
    data: { paidOut: false, paidOutAt: null },
  });
  revalidatePath("/admin/settlements");
  return { ok: true, message: `${res.count}건 되돌림`, count: res.count };
}
