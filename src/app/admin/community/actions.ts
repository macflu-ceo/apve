"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { grantVoucher } from "@/lib/voucher";

function revalidate() {
  revalidatePath("/admin/community");
  revalidatePath("/community");
  revalidatePath("/");
}

// ── 게시글 관리 ──
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

/** 이 커뮤니티 글(판매노하우 등) 작성자에게 20% 바우처 1개 지급 (글당 1회) */
export async function grantRewardForCommunityPost(postId: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, partnerId: true, rewarded: true },
  });
  if (!post) return { ok: false, message: "글을 찾을 수 없습니다." };
  if (post.rewarded) return { ok: false, message: "이미 이 글로 지급했습니다." };
  await prisma.$transaction([
    prisma.rewardVoucher.create({ data: { partnerId: post.partnerId, reason: "판매노하우 보상", sourcePostId: post.id } }),
    prisma.communityPost.update({ where: { id: post.id }, data: { rewarded: true } }),
  ]);
  revalidate();
  return { ok: true, message: "20% 바우처를 지급했습니다." };
}

// ── 카테고리 관리 ──
function slug(label: string) {
  // 영문/숫자는 소문자 슬러그, 한글 등은 base36 해시로 안정적 키 생성
  const ascii = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (ascii) return ascii.slice(0, 30);
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return "cat-" + h.toString(36);
}

export async function createCategory(label: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const l = label.trim();
  if (!l) return { ok: false, message: "카테고리명을 입력하세요." };
  const count = await prisma.communityCategory.count();
  let key = slug(l);
  // 키 충돌 방지
  if (await prisma.communityCategory.findUnique({ where: { key } })) key = `${key}-${count}`;
  await prisma.communityCategory.create({ data: { key, label: l, sort: count } });
  revalidate();
  return { ok: true, message: "카테고리를 추가했습니다." };
}

export async function toggleCategory(id: string, active: boolean) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.communityCategory.update({ where: { id }, data: { active } });
  revalidate();
  return { ok: true, message: active ? "노출했습니다." : "숨겼습니다." };
}

export async function deleteCategory(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const cat = await prisma.communityCategory.findUnique({ where: { id }, select: { key: true } });
  if (cat) {
    const used = await prisma.communityPost.count({ where: { category: cat.key } });
    if (used > 0) return { ok: false, message: `이 카테고리 글이 ${used}개 있어 삭제할 수 없어요. 대신 '숨김'을 쓰세요.` };
  }
  await prisma.communityCategory.delete({ where: { id } });
  revalidate();
  return { ok: true, message: "삭제했습니다." };
}
