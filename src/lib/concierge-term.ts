import { prisma } from "@/lib/db";

/**
 * 컨시어지 유지 조건.
 *
 * 자격을 준 날부터 3개월이 한 구간이고, 그 안에 매출 200만원을 채워야 유지된다.
 * 못 채우면 자격이 풀려 일반 어필리에이터로 돌아간다 — 자리를 잡아두고 안 파는 사람이
 * 쌓이면 컨시어지라는 이름 자체가 값이 없어진다.
 */
export const TERM_MONTHS = 3;
export const TERM_TARGET = 2_000_000;

export type ConciergeTerm = {
  startedAt: Date | null;
  endsAt: Date | null;
  /** 남은 일수. 시작일이 없으면 null */
  daysLeft: number | null;
  /** 이번 구간 매출(구매확정 기준) */
  sales: number;
  /** 200만원 대비 달성률(%) */
  rate: number;
  /** 기한이 지났는데 못 채웠다 */
  expired: boolean;
};

export function termEnd(startedAt: Date): Date {
  const d = new Date(startedAt);
  d.setMonth(d.getMonth() + TERM_MONTHS);
  return d;
}

/** 한 사람의 이번 구간 성적 */
export async function conciergeTerm(
  partnerId: string,
  startedAt: Date | null,
  now = new Date(),
): Promise<ConciergeTerm> {
  if (!startedAt) {
    return { startedAt: null, endsAt: null, daysLeft: null, sales: 0, rate: 0, expired: false };
  }
  const endsAt = termEnd(startedAt);
  const agg = await prisma.sale.aggregate({
    where: {
      partnerId,
      status: "confirmed",
      orderedAt: { gte: startedAt, lt: endsAt },
    },
    _sum: { amount: true },
  });
  const sales = agg._sum.amount ?? 0;
  return {
    startedAt,
    endsAt,
    daysLeft: Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000),
    sales,
    rate: Math.min(999, Math.round((sales / TERM_TARGET) * 100)),
    expired: now >= endsAt && sales < TERM_TARGET,
  };
}
