"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { clearSession } from "@/lib/auth";

/**
 * 회원 탈퇴 — 개인정보 즉시 파기 + 계정 비활성화.
 * 거래/정산 기록(Sale 등)은 FK·법정보관 때문에 남기되, 개인 식별정보는 모두 제거(익명화).
 */
export async function deleteMyAccount() {
  const partner = await getSessionPartner();
  if (!partner) return;

  await prisma.partner.update({
    where: { id: partner.id },
    data: {
      active: false,
      status: "rejected", // 재로그인 차단
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
      // 로그인 불가하도록 비밀번호 무효화
      passwordHash: "deleted:" + crypto.randomBytes(16).toString("hex"),
    },
  });

  clearSession();
  redirect("/");
}
