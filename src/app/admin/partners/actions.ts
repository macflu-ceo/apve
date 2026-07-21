"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/** 가입 신청 승인 — 고도몰에서 발급한 코드를 입력해 부여하고 활성화 */
export async function approvePartner(id: string, code: string) {
  const c = code.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(c)) return { ok: false, message: "코드는 영문/숫자/-/_ 만 사용하세요." };
  const dup = await prisma.partner.findFirst({ where: { code: c, NOT: { id } } });
  if (dup) return { ok: false, message: `이미 사용 중인 코드입니다: ${c}` };

  await prisma.partner.update({
    where: { id },
    data: { status: "approved", code: c, active: true },
  });
  revalidatePath("/admin/partners");
  return { ok: true, message: "승인 완료" };
}

/** 가입 신청 반려 */
export async function rejectPartner(id: string) {
  await prisma.partner.update({ where: { id }, data: { status: "rejected", active: false } });
  revalidatePath("/admin/partners");
  return { ok: true, message: "반려되었습니다." };
}

/** 파트너 활성/비활성 토글 */
export async function togglePartnerActive(id: string, active: boolean) {
  await prisma.partner.update({ where: { id }, data: { active } });
  revalidatePath("/admin/partners");
}
