"use server";

import { prisma } from "@/lib/db";
import { alertConcierge } from "@/lib/report/alerts";

export async function submitConciergeApplication(input: {
  name: string;
  phone: string;
  job: string;
  region: string;
  age: string;
  answers: Record<string, string>;
}) {
  if (!input.name.trim() || !input.phone.trim()) {
    return { ok: false, message: "이름과 전화번호는 필수입니다." };
  }
  const { getSessionPartner } = await import("@/lib/auth");
  const viewer = await getSessionPartner().catch(() => null);
  await prisma.conciergeApplication.create({
    data: {
      partnerId: viewer?.id ?? null, // 로그인 신청이면 계정 연결 → 어드민 승인 시 바로 전환
      name: input.name.trim(),
      phone: input.phone.trim(),
      job: input.job.trim() || null,
      region: input.region.trim() || null,
      age: input.age.trim() || null,
      answersJson: JSON.stringify(input.answers ?? {}),
    },
  });
  await alertConcierge({ name: input.name.trim(), phone: input.phone.trim(), job: input.job?.trim() || null, region: input.region?.trim() || null });
  return { ok: true, message: "신청이 접수되었습니다. 담당자가 곧 연락드릴게요." };
}
