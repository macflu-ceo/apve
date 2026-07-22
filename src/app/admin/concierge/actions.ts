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
