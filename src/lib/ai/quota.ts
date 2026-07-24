// AI 이미지 생성 사용량 제한
//  · 하루 5장 (한국시간 자정 기준 초기화)
//  · 5장을 모두 쓴 뒤에는 1시간에 1장씩만 추가 생성 가능
import { prisma } from "@/lib/db";

export const DAILY_LIMIT = 5;
export const COOLDOWN_MINUTES = 60;

/** 한국시간(KST) 기준 오늘 자정을 UTC Date 로 반환 */
export function kstMidnight(now = new Date()): Date {
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + KST_OFFSET);
  const kstMid = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate());
  return new Date(kstMid - KST_OFFSET);
}

export type QuotaState = {
  used: number;
  limit: number;
  remaining: number;
  /** 지금 생성 가능한가 */
  canGenerate: boolean;
  /** 대기해야 한다면 남은 분 */
  waitMinutes: number;
  message: string;
};

export async function getQuota(partnerId: string, now = new Date()): Promise<QuotaState> {
  const since = kstMidnight(now);

  const [used, last] = await Promise.all([
    prisma.tryOnImage.count({ where: { partnerId, createdAt: { gte: since } } }),
    prisma.tryOnImage.findFirst({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const remaining = Math.max(0, DAILY_LIMIT - used);

  // 일일 한도가 남아있으면 바로 생성 가능
  if (remaining > 0) {
    return {
      used,
      limit: DAILY_LIMIT,
      remaining,
      canGenerate: true,
      waitMinutes: 0,
      message: `오늘 ${remaining}장 더 만들 수 있어요.`,
    };
  }

  // 한도 소진 → 마지막 생성 후 1시간 경과해야 1장 추가 가능
  const lastAt = last?.createdAt;
  if (!lastAt) {
    return { used, limit: DAILY_LIMIT, remaining: 0, canGenerate: true, waitMinutes: 0, message: "" };
  }
  const elapsedMin = Math.floor((now.getTime() - lastAt.getTime()) / 60000);
  const waitMinutes = Math.max(0, COOLDOWN_MINUTES - elapsedMin);

  if (waitMinutes === 0) {
    return {
      used,
      limit: DAILY_LIMIT,
      remaining: 0,
      canGenerate: true,
      waitMinutes: 0,
      message: "일일 한도를 모두 사용해 1시간에 1장씩 생성됩니다.",
    };
  }

  return {
    used,
    limit: DAILY_LIMIT,
    remaining: 0,
    canGenerate: false,
    waitMinutes,
    message: `오늘 ${DAILY_LIMIT}장을 모두 사용했어요. ${waitMinutes}분 후에 1장 더 만들 수 있어요. (매일 자정 초기화)`,
  };
}
