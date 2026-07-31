"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { grantVoucher } from "@/lib/voucher";

function revalidate() {
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

export async function setHidden(id: string, hidden: boolean) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.communityPost.update({ where: { id }, data: { hidden } });
  revalidate();
  return { ok: true, message: hidden ? "숨겼습니다." : "노출했습니다." };
}

export async function setPinned(id: string, pinned: boolean) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.communityPost.update({ where: { id }, data: { pinned } });
  revalidate();
  return { ok: true, message: pinned ? "고정했습니다." : "고정 해제했습니다." };
}

/** 이 글에 대해 작성자에게 20% 바우처 1개 지급 (중복 방지) */
export async function grantRewardForPost(postId: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, partnerId: true, category: true, rewarded: true },
  });
  if (!post) return { ok: false, message: "글을 찾을 수 없습니다." };
  if (post.rewarded) return { ok: false, message: "이미 이 글로 지급했습니다." };

  const catLabel = post.category === "review" ? "리뷰인증" : post.category === "promo" ? "홍보인증" : "판매노하우";
  await prisma.$transaction([
    prisma.rewardVoucher.create({
      data: { partnerId: post.partnerId, reason: `커뮤니티 보상(${catLabel})`, sourcePostId: post.id },
    }),
    prisma.communityPost.update({ where: { id: post.id }, data: { rewarded: true } }),
  ]);
  revalidate();
  return { ok: true, message: "20% 바우처를 지급했습니다." };
}

/** 회원에게 수동으로 바우처 1개 지급 (회원관리 등에서) */
export async function grantVoucherManual(partnerId: string, reason: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await grantVoucher(partnerId, reason.trim() || "운영자 지급");
  revalidatePath("/admin/community");
  return { ok: true, message: "지급했습니다." };
}
