"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export interface RuleInput {
  id?: string;
  name: string;
  trigger: string;
  segment: string;
  threshold?: number | null;
  message: string;
  active: boolean;
}

export async function saveRule(input: RuleInput) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  if (!input.name.trim() || !input.message.trim()) return { ok: false, message: "이름과 본문을 입력하세요." };

  const data = {
    name: input.name.trim(),
    trigger: input.trigger,
    segment: input.segment,
    threshold: input.trigger === "commission" ? Math.max(0, Math.round(input.threshold ?? 0)) : null,
    message: input.message,
    active: input.active,
  };

  try {
    if (input.id) {
      await prisma.alimtalkRule.update({ where: { id: input.id }, data });
    } else {
      await prisma.alimtalkRule.create({ data: { ...data, sort: 100 } });
    }
    revalidatePath("/admin/crm");
    return { ok: true, message: "저장되었습니다." };
  } catch (e) {
    // 같은 트리거+세그먼트+임계값 중복
    return { ok: false, message: e instanceof Error && e.message.includes("Unique") ? "같은 조건의 규칙이 이미 있습니다." : "저장 실패" };
  }
}

export async function toggleRule(id: string, active: boolean) {
  if (!isAdmin()) return { ok: false };
  await prisma.alimtalkRule.update({ where: { id }, data: { active } });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function deleteRule(id: string) {
  if (!isAdmin()) return { ok: false };
  await prisma.alimtalkRule.delete({ where: { id } });
  revalidatePath("/admin/crm");
  return { ok: true };
}
