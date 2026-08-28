"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { getActiveCommunityCategories } from "@/lib/community";
import { findObjectionable } from "@/lib/community-moderation";

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
  if (!input.images.length) return { ok: false, message: "사진을 1장 이상 첨부해야 게시할 수 있어요." };
  const bad = findObjectionable(`${title} ${content}`);
  if (bad) return { ok: false, message: "부적절한 표현이 포함되어 등록할 수 없습니다. 커뮤니티 이용규칙을 지켜주세요." };

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
  if (findObjectionable(c)) return { ok: false, message: "부적절한 표현이 포함되어 등록할 수 없습니다." };
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

/** 신고 — 게시글 또는 댓글을 부적절 콘텐츠로 신고 (관리자가 24시간 내 처리) */
export async function reportContent(input: { postId?: string; commentId?: string; reason: string }) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, message: "로그인이 필요합니다." };
  if (!input.postId && !input.commentId) return { ok: false, message: "대상이 없습니다." };
  const reason = (input.reason || "부적절한 콘텐츠").trim().slice(0, 200);
  // 같은 대상 중복 신고 방지
  const dup = await prisma.communityReport.findFirst({
    where: { reporterId: partner.id, postId: input.postId ?? null, commentId: input.commentId ?? null, status: "open" },
    select: { id: true },
  });
  if (dup) return { ok: true, message: "이미 신고했습니다. 검토 중입니다." };
  await prisma.communityReport.create({
    data: { reporterId: partner.id, postId: input.postId ?? null, commentId: input.commentId ?? null, reason },
  });
  return { ok: true, message: "신고가 접수되었습니다. 24시간 내 검토합니다." };
}

/** 회원 차단 — 차단하면 그 회원 글/댓글이 내 피드에서 즉시 사라짐 + 관리자에 신고 기록 */
export async function blockAuthor(blockedId: string) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, message: "로그인이 필요합니다." };
  if (blockedId === partner.id) return { ok: false, message: "본인은 차단할 수 없습니다." };
  await prisma.partnerBlock.upsert({
    where: { blockerId_blockedId: { blockerId: partner.id, blockedId } },
    create: { blockerId: partner.id, blockedId },
    update: {},
  });
  // 차단은 개발자(관리자)에게도 통지되도록 신고로 기록
  await prisma.communityReport
    .create({ data: { reporterId: partner.id, reason: `사용자 차단(피차단: ${blockedId})` } })
    .catch(() => {});
  revalidatePath("/community");
  return { ok: true, message: "차단했습니다. 이 회원의 글·댓글이 더 이상 보이지 않습니다." };
}
