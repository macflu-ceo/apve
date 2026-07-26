// CRM 발송 대상(세그먼트) 계산
import { prisma } from "@/lib/db";

export interface CrmFilter {
  /** 특정 등급 id (미지정=전체) */
  gradeId?: string;
  /** 마케팅 수신 동의자만 (친구톡 등 광고성 발송 시 필수) */
  marketingOnly?: boolean;
  /** 카카오 채널 친구만 (친구톡 대상) */
  channelFriendOnly?: boolean;
  /** 승인된 회원만 (기본 true) */
  approvedOnly?: boolean;
  /** 최근 N일 이내 로그인 (미지정=전체) */
  activeDays?: number;
  /** 판매 실적 보유자만 */
  hasSales?: boolean;
}

export function buildWhere(f: CrmFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (f.approvedOnly !== false) where.status = "approved";
  if (f.gradeId) where.gradeId = f.gradeId;
  if (f.marketingOnly) where.marketingAgreed = true;
  if (f.channelFriendOnly) where.channelFriend = true;
  if (f.activeDays && f.activeDays > 0) {
    where.lastLoginAt = { gte: new Date(Date.now() - f.activeDays * 86400_000) };
  }
  if (f.hasSales) where.sales = { some: {} };
  return where;
}

export async function countAudience(f: CrmFilter): Promise<number> {
  return prisma.partner.count({ where: buildWhere(f) });
}

export async function resolveAudience(f: CrmFilter) {
  return prisma.partner.findMany({
    where: buildWhere(f),
    select: { id: true, name: true, phone: true, marketingAgreed: true, channelFriend: true },
  });
}
