import { prisma } from "@/lib/db";
import { cache } from "react";

/** 카테고리 테이블이 비어있으면 기본값(판매 노하우) 1개 생성 */
export const ensureDefaultCommunityCategory = cache(async () => {
  const n = await prisma.communityCategory.count();
  if (n === 0) {
    try {
      await prisma.communityCategory.create({ data: { key: "knowhow", label: "판매 노하우", sort: 0 } });
    } catch {
      /* 경쟁 생성 무시 */
    }
  }
});

/** 전체 카테고리 (어드민) */
export async function getAllCommunityCategories() {
  await ensureDefaultCommunityCategory();
  return prisma.communityCategory.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
}

/** 노출 카테고리 (사용자) */
export async function getActiveCommunityCategories() {
  await ensureDefaultCommunityCategory();
  return prisma.communityCategory.findMany({
    where: { active: true },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
}

/** key → label 매핑 */
export async function categoryLabelMap(): Promise<Map<string, string>> {
  const cats = await prisma.communityCategory.findMany({ select: { key: true, label: true } });
  return new Map(cats.map((c) => [c.key, c.label]));
}

/** 작성자 표시명 — 닉네임 우선, 없으면 이름 앞글자 마스킹 */
export function displayAuthor(p: { nickname: string | null; name: string }): string {
  if (p.nickname) return p.nickname;
  return p.name.length > 1 ? p.name[0] + "*".repeat(p.name.length - 1) : p.name;
}

/** 커뮤니티 목록 — 노출 카테고리의 글만. 고정글 먼저. */
export async function getCommunityPosts(category?: string, take = 50) {
  const active = await getActiveCommunityCategories();
  const activeKeys = active.map((c) => c.key);
  const where = {
    hidden: false,
    category: category && activeKeys.includes(category) ? category : { in: activeKeys },
  };
  return prisma.communityPost.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      partner: { select: { nickname: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
}

export async function getCommunityPost(id: string) {
  return prisma.communityPost.findUnique({
    where: { id },
    include: { partner: { select: { nickname: true, name: true } } },
  });
}

/** 홈 미리보기용 — 최신 판매노하우 등 (노출 카테고리) */
export async function getLatestCommunityPosts(take = 8) {
  const active = await getActiveCommunityCategories();
  return prisma.communityPost.findMany({
    where: { hidden: false, category: { in: active.map((c) => c.key) } },
    orderBy: { createdAt: "desc" },
    take,
    include: { partner: { select: { nickname: true, name: true } } },
  });
}
