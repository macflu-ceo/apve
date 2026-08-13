import { prisma } from "@/lib/db";

/**
 * 커뮤니티 콘텐츠 필터 — 욕설·혐오·불법 관련 금지어.
 * 게시글/댓글 등록 시 검사해서 발견되면 등록을 차단한다.
 * (완벽하진 않지만 명백한 부적절 표현을 1차로 걸러냄 + 신고/차단으로 보완)
 */
const BANNED = [
  // 욕설·비속어
  "씨발", "시발", "씨빨", "개새끼", "개새기", "새끼", "좆", "존나", "병신", "지랄", "닥쳐",
  "썅", "니미", "느금", "엠창", "창녀", "걸레", "미친놈", "미친년", "썅놈",
  // 혐오·차별
  "김치녀", "한남", "된장녀", "틀딱", "짱깨", "쪽바리",
  // 성적/불법
  "성매매", "조건만남", "몸캠", "야동", "도박사이트", "불법도박", "필로폰", "대마초",
  // 영어
  "fuck", "shit", "bitch", "asshole", "bastard", "nigger", "cunt", "porn",
];

/** 부적절 표현이 있으면 해당 단어 반환, 없으면 null */
export function findObjectionable(text: string): string | null {
  const t = (text || "").toLowerCase().replace(/[\s.]+/g, "");
  for (const w of BANNED) {
    if (t.includes(w)) return w;
  }
  return null;
}

/** 뷰어가 차단한 회원 id 집합 (피드에서 즉시 숨김용) */
export async function getBlockedIds(viewerId: string | null | undefined): Promise<string[]> {
  if (!viewerId) return [];
  const rows = await prisma.partnerBlock.findMany({
    where: { blockerId: viewerId },
    select: { blockedId: true },
  });
  return rows.map((r) => r.blockedId);
}
