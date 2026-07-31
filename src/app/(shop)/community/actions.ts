"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { getActiveCommunityCategories } from "@/lib/community";

/** 커뮤니티 글 작성 — 승인된 회원만 */
export async function createCommunityPost(input: {
  category: string;
  title: string;
  content: string;
  images: string[];
}) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, message: "로그인이 필요합니다." };
  if (partner.status !== "approved") return { ok: false, message: "승인된 회원만 작성할 수 있습니다." };
  const active = await getActiveCommunityCategories();
  if (!active.some((c) => c.key === input.category)) return { ok: false, message: "카테고리를 선택하세요." };
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { ok: false, message: "제목과 내용을 입력하세요." };

  const post = await prisma.communityPost.create({
    data: {
      partnerId: partner.id,
      category: input.category,
      title,
      content,
      imagesJson: input.images.length ? JSON.stringify(input.images.slice(0, 8)) : null,
    },
  });
  revalidatePath("/community");
  return { ok: true, id: post.id, message: "등록되었습니다." };
}

export async function deleteMyCommunityPost(id: string) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, message: "로그인이 필요합니다." };
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { partnerId: true } });
  if (!post || post.partnerId !== partner.id) return { ok: false, message: "본인 글만 삭제할 수 있습니다." };
  await prisma.communityPost.delete({ where: { id } });
  revalidatePath("/community");
  redirect("/community");
}
