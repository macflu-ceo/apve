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
  await prisma.conciergeApplication.create({
    data: {
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
