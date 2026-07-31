"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { grantVoucher } from "@/lib/voucher";

export async function approveReward(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const sub = await prisma.rewardSubmission.findUnique({
    where: { id },
    select: { id: true, partnerId: true, type: true, status: true },
  });
  if (!sub) return { ok: false, message: "제출을 찾을 수 없습니다." };
  if (sub.status === "approved") return { ok: false, message: "이미 승인했습니다." };

  const label = sub.type === "review" ? "리뷰인증" : "홍보인증";
  await prisma.$transaction([
    prisma.rewardVoucher.create({ data: { partnerId: sub.partnerId, reason: `${label} 보상`, sourcePostId: sub.id } }),
    prisma.rewardSubmission.update({ where: { id }, data: { status: "approved", rewarded: true, reviewedAt: new Date() } }),
  ]);
  revalidatePath("/admin/rewards");
  return { ok: true, message: "승인하고 20% 바우처를 지급했습니다." };
}

/** 아이디로 회원에게 20% 바우처 직접 지급 */
export async function grantVoucherByUsername(username: string, count: number) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const u = username.trim();
  if (!u) return { ok: false, message: "회원 아이디를 입력하세요." };
  const n = Math.max(1, Math.min(20, Math.floor(count) || 1));
  const partner = await prisma.partner.findUnique({ where: { username: u }, select: { id: true, name: true } });
  if (!partner) return { ok: false, message: "해당 아이디의 회원이 없습니다." };
  await prisma.rewardVoucher.createMany({
    data: Array.from({ length: n }, () => ({ partnerId: partner.id, reason: "운영자 직접 지급" })),
  });
  revalidatePath("/admin/rewards");
  return { ok: true, message: `${partner.name} 님에게 ${n}개 지급했습니다.` };
}

export async function rejectReward(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.rewardSubmission.update({ where: { id }, data: { status: "rejected", reviewedAt: new Date() } });
  revalidatePath("/admin/rewards");
  return { ok: true, message: "반려했습니다." };
}
