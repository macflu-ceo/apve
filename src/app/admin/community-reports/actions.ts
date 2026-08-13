"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/** 신고 처리완료로 표시 */
export async function resolveReport(id: string) {
  await prisma.communityReport.update({ where: { id }, data: { status: "resolved" } });
  revalidatePath("/admin/community-reports");
  return { ok: true, message: "처리 완료로 표시했습니다." };
}

/** 신고된 게시글 숨김(삭제 아님) + 관련 신고 처리완료 */
export async function hideReportedPost(postId: string) {
  await prisma.communityPost.update({ where: { id: postId }, data: { hidden: true } }).catch(() => {});
  await prisma.communityReport.updateMany({ where: { postId, status: "open" }, data: { status: "resolved" } });
  revalidatePath("/admin/community-reports");
  revalidatePath("/community");
  return { ok: true, message: "게시글을 숨기고 신고를 처리했습니다." };
}

/** 신고된 댓글 삭제 + 관련 신고 처리완료 */
export async function deleteReportedComment(commentId: string) {
  await prisma.communityComment.delete({ where: { id: commentId } }).catch(() => {});
  await prisma.communityReport.updateMany({ where: { commentId, status: "open" }, data: { status: "resolved" } });
  revalidatePath("/admin/community-reports");
  return { ok: true, message: "댓글을 삭제하고 신고를 처리했습니다." };
}

/** 작성자 이용정지 — 로그인 차단(글은 남기되 재발 방지). 신고 처리완료. */
export async function suspendReportedUser(partnerId: string) {
  await prisma.partner.update({ where: { id: partnerId }, data: { active: false } }).catch(() => {});
  revalidatePath("/admin/community-reports");
  revalidatePath("/admin/partners");
  return { ok: true, message: "해당 회원의 이용을 정지했습니다(로그인 차단)." };
}
