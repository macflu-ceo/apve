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

/** 좋아요 토글 — 승인 회원만 */
export async function toggleLike(postId: string) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, liked: false, message: "로그인이 필요합니다." };
  if (partner.status !== "approved") return { ok: false, liked: false, message: "승인된 회원만 이용할 수 있습니다." };
  const existing = await prisma.communityLike.findUnique({
    where: { postId_partnerId: { postId, partnerId: partner.id } },
    select: { id: true },
  });
  if (existing) {
    await prisma.communityLike.delete({ where: { id: existing.id } });
    revalidatePath(`/community/${postId}`);
    return { ok: true, liked: false, message: "" };
  }
  await prisma.communityLike.create({ data: { postId, partnerId: partner.id } });
  revalidatePath(`/community/${postId}`);
  return { ok: true, liked: true, message: "" };
}

/** 댓글 작성 — 승인 회원만 */
export async function addComment(postId: string, content: string) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, message: "로그인이 필요합니다." };
  if (partner.status !== "approved") return { ok: false, message: "승인된 회원만 댓글을 쓸 수 있습니다." };
  const c = content.trim();
  if (!c) return { ok: false, message: "내용을 입력하세요." };
  await prisma.communityComment.create({ data: { postId, partnerId: partner.id, content: c.slice(0, 500) } });
  revalidatePath(`/community/${postId}`);
  return { ok: true, message: "" };
}

/** 댓글 삭제 — 본인만 */
export async function deleteComment(id: string) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, message: "로그인이 필요합니다." };
  const c = await prisma.communityComment.findUnique({ where: { id }, select: { partnerId: true, postId: true } });
  if (!c || c.partnerId !== partner.id) return { ok: false, message: "본인 댓글만 삭제할 수 있습니다." };
  await prisma.communityComment.delete({ where: { id } });
  revalidatePath(`/community/${c.postId}`);
  return { ok: true, message: "" };
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
