"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { notifySignupApproved } from "@/lib/crm/events";

/** 강제 탈퇴 — 관리자가 회원을 탈퇴 처리(개인정보 즉시 파기 + 로그인 차단).
 * 거래·정산 기록(FK)은 남기되 개인 식별정보는 모두 익명화. 회원 본인 탈퇴와 동일 처리. */
export async function forceDeletePartner(id: string) {
  await prisma.partner.update({
    where: { id },
    data: {
      active: false,
      status: "rejected",
      name: "탈퇴회원",
      nickname: null,
      phone: null,
      email: null,
      ci: null,
      residentNoEnc: null,
      address: null,
      bankName: null,
      bankAccount: null,
      accountHolder: null,
      idCardUrl: null,
      bankbookUrl: null,
      conciergeNo: null,
      passwordHash: "deleted:" + crypto.randomBytes(16).toString("hex"),
    },
  });
  revalidatePath("/admin/partners");
  return { ok: true, message: "강제 탈퇴 처리되었습니다." };
}

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
  await notifySignupApproved(id).catch(() => {}); // 승인 환영 알림톡 (mock)
  revalidatePath("/admin/partners");
  return { ok: true, message: "승인 완료" };
}

/** 가입 신청 반려 */
export async function rejectPartner(id: string) {
  await prisma.partner.update({ where: { id }, data: { status: "rejected", active: false } });
  revalidatePath("/admin/partners");
  return { ok: true, message: "반려되었습니다." };
}

/** 회원 등급 수동 지정 (null이면 실적 기반 자동 판정으로 되돌림) */
export async function setPartnerGrade(id: string, gradeId: string | null) {
  await prisma.partner.update({ where: { id }, data: { gradeId } });
  revalidatePath("/admin/partners");
  revalidatePath("/me");
}

/** 정산 정보 확인 완료 처리 */
export async function verifySettlement(id: string, verified: boolean) {
  await prisma.partner.update({
    where: { id },
    data: { settlementStatus: verified ? "verified" : "submitted", docsStatus: verified ? "approved" : "submitted" },
  });
  revalidatePath("/admin/partners");
  revalidatePath("/me");
}

/** 파트너 활성/비활성 토글 */
export async function togglePartnerActive(id: string, active: boolean) {
  await prisma.partner.update({ where: { id }, data: { active } });
  revalidatePath("/admin/partners");
}
