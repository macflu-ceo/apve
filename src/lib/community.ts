import { prisma } from "@/lib/db";

export const COMMUNITY_CATEGORIES = [
  { key: "review", label: "리뷰인증", desc: "구매·사용 후기 인증" },
  { key: "promo", label: "홍보인증", desc: "SNS·지인 홍보 인증" },
  { key: "knowhow", label: "판매 노하우", desc: "판매 팁·경험 공유" },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["key"];

export function categoryLabel(key: string): string {
  return COMMUNITY_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
export function isCommunityCategory(v: string): v is CommunityCategory {
  return COMMUNITY_CATEGORIES.some((c) => c.key === v);
}

/** 작성자 표시명 — 닉네임 우선, 없으면 이름 앞글자 마스킹 */
export function displayAuthor(p: { nickname: string | null; name: string }): string {
  if (p.nickname) return p.nickname;
  return p.name.length > 1 ? p.name[0] + "*".repeat(p.name.length - 1) : p.name;
}

/** 커뮤니티 목록 (카테고리 선택). 고정글 먼저. */
export async function getCommunityPosts(category?: string, take = 50) {
  return prisma.communityPost.findMany({
    where: { hidden: false, ...(category && isCommunityCategory(category) ? { category } : {}) },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take,
    include: { partner: { select: { nickname: true, name: true } } },
  });
}

export async function getCommunityPost(id: string) {
  return prisma.communityPost.findUnique({
    where: { id },
    include: { partner: { select: { nickname: true, name: true } } },
  });
}
