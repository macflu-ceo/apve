"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";

/** 리뷰/홍보 인증 제출 — 커뮤니티에 공개되지 않고 관리자만 확인 (승인 시 20% 바우처) */
export async function submitReward(input: { type: string; content: string; images: string[] }) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, message: "로그인이 필요합니다." };
  if (partner.status !== "approved") return { ok: false, message: "승인된 회원만 제출할 수 있습니다." };
  if (input.type !== "review" && input.type !== "promo") return { ok: false, message: "인증 종류를 선택하세요." };
  const content = input.content.trim();
  if (!content) return { ok: false, message: "내용을 입력하세요." };
  const imgs = input.images.filter(Boolean).slice(0, 6);
  if (imgs.length === 0) return { ok: false, message: "인증 사진을 1장 이상 첨부하세요." };

  await prisma.rewardSubmission.create({
    data: {
      partnerId: partner.id,
      type: input.type,
      content,
      imagesJson: JSON.stringify(imgs),
    },
  });
  revalidatePath("/me");
  return { ok: true, message: "제출되었습니다. 관리자 확인 후 20% 바우처가 지급됩니다." };
}
