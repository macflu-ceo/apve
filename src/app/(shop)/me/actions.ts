"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { encryptSensitive } from "@/lib/crypto";

export async function submitSettlement(input: {
  residentNo: string;
  address: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  idCardPath: string;
  bankbookPath: string;
  agree: boolean;
}) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, message: "로그인이 필요합니다." };
  if (!input.agree) return { ok: false, message: "정산을 위한 개인정보 수집·이용에 동의해야 합니다." };

  const rrn = input.residentNo.replace(/[^0-9]/g, "");
  if (rrn.length !== 13) return { ok: false, message: "주민등록번호 13자리를 정확히 입력해주세요." };
  if (!input.address.trim()) return { ok: false, message: "주소를 입력해주세요." };
  if (!input.bankName.trim() || !input.bankAccount.trim() || !input.accountHolder.trim())
    return { ok: false, message: "은행명·계좌번호·예금주를 모두 입력해주세요." };
  if (input.accountHolder.trim() !== partner.name)
    return { ok: false, message: `예금주명이 회원 실명(${partner.name})과 일치해야 합니다. 본인 명의 계좌만 등록할 수 있어요.` };
  if (!input.idCardPath || !input.bankbookPath)
    return { ok: false, message: "신분증 사본과 통장 사본을 모두 첨부해주세요." };

  await prisma.partner.update({
    where: { id: partner.id },
    data: {
      residentNoEnc: encryptSensitive(rrn),
      address: input.address.trim(),
      bankName: input.bankName.trim(),
      bankAccount: input.bankAccount.trim(),
      accountHolder: input.accountHolder.trim(),
      idCardUrl: input.idCardPath,
      bankbookUrl: input.bankbookPath,
      settlementStatus: "submitted",
      docsStatus: "submitted",
      settlementAgreedAt: new Date(),
    },
  });

  revalidatePath("/me");
  revalidatePath("/admin/partners");
  return { ok: true, message: "정산 정보가 접수되었습니다. 확인 후 지급이 진행됩니다." };
}
