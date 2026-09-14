"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const rv = () => {
  revalidatePath("/admin/concierge");
  revalidatePath("/concierge");
};

/* ── 신청 관리 ── */
export async function setApplicationStatus(id: string, status: string) {
  await prisma.conciergeApplication.update({ where: { id }, data: { status } });
  rv();
}
export async function setApplicationMemo(id: string, memo: string) {
  await prisma.conciergeApplication.update({ where: { id }, data: { memo } });
  rv();
}
export async function deleteApplication(id: string) {
  await prisma.conciergeApplication.delete({ where: { id } });
  rv();
}

/* ── 문항 관리 ── */
export async function addQuestion(input: { label: string; type: string; options: string[]; required: boolean; sort: number }) {
  if (!input.label.trim()) return { ok: false, message: "질문을 입력하세요." };
  await prisma.conciergeQuestion.create({
    data: {
      label: input.label.trim(),
      type: input.type,
      optionsJson: input.type === "select" ? JSON.stringify(input.options) : null,
      required: input.required,
      sort: input.sort,
    },
  });
  rv();
  return { ok: true, message: "문항이 추가되었습니다." };
}
export async function updateQuestion(id: string, data: { label?: string; sort?: number; required?: boolean; active?: boolean }) {
  await prisma.conciergeQuestion.update({ where: { id }, data });
  rv();
}
export async function deleteQuestion(id: string) {
  await prisma.conciergeQuestion.delete({ where: { id } });
  rv();
}

/**
 * 신청 승인 → 컨시어지 전환.
 * 신청 시 로그인했던 계정(partnerId)을 우선 쓰고, 없으면 전화번호로 회원을 찾는다.
 * 전환 성공 시 신청 상태를 done으로 바꾼다.
 */
export async function approveApplication(id: string) {
  const app = await prisma.conciergeApplication.findUnique({ where: { id } });
  if (!app) return { ok: false, message: "신청을 찾을 수 없습니다." };

  // 1) 회원 찾기 — 계정 연결 우선, 없으면 전화번호(숫자만/하이픈 표기 모두) 대조
  let partner = app.partnerId
    ? await prisma.partner.findUnique({ where: { id: app.partnerId } })
    : null;
  if (!partner) {
    const digits = app.phone.replace(/\D/g, "");
    const hyphen = digits.length === 11 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : digits;
    partner = await prisma.partner.findFirst({
      where: { phone: { in: [digits, hyphen] }, active: true },
      orderBy: { createdAt: "desc" },
    });
  }
  if (!partner) {
    return { ok: false, message: "연결된 회원을 못 찾았습니다. 전화번호가 가입 정보와 다르면 컨시어지 회원 관리에서 아이디로 직접 임명해주세요." };
  }
  if (partner.conciergeNo != null) {
    await prisma.conciergeApplication.update({ where: { id }, data: { status: "done" } });
    revalidatePath("/admin/concierge");
    return { ok: true, message: `${partner.name}님은 이미 컨시어지입니다 (No.${partner.conciergeNo}).` };
  }

  // 2) 다음 컨시어지 번호를 원자적으로 부여 (unique 충돌 시 재시도)
  for (let attempt = 0; attempt < 5; attempt++) {
    const max = await prisma.partner.aggregate({ _max: { conciergeNo: true } });
    const next = (max._max.conciergeNo ?? 0) + 1 + attempt;
    try {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { conciergeNo: next, conciergeStartedAt: new Date() },
      });
      await prisma.conciergeApplication.update({ where: { id }, data: { status: "done" } });
      revalidatePath("/admin/concierge");
      revalidatePath("/admin/concierge-members");
      return { ok: true, message: `승인 완료 — ${partner.name}(@${partner.username})님을 컨시어지 No.${next}로 전환했습니다.` };
    } catch {
      /* 번호 충돌 → 재시도 */
    }
  }
  return { ok: false, message: "컨시어지 번호 부여에 실패했습니다. 다시 시도해주세요." };
}
