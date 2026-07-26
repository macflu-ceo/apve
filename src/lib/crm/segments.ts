// CRM 세그먼트 — 승인 회원을 4개 그룹으로 나눈다.
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type SegmentKey = "all" | "new" | "active" | "vip" | "dormant";

export const SEGMENTS: { key: SegmentKey; label: string; desc: string }[] = [
  { key: "all", label: "전체", desc: "승인된 모든 회원" },
  { key: "new", label: "신규", desc: "승인됐지만 아직 판매 0건" },
  { key: "active", label: "활성", desc: "최근 30일 내 로그인 또는 판매" },
  { key: "vip", label: "VIP", desc: "누적 수수료 100만원 이상 또는 상위 등급" },
  { key: "dormant", label: "휴면", desc: "30일 이상 로그인 없음" },
];

const VIP_COMMISSION = 1_000_000;
const DAYS = 30;

/** 세그먼트별 Prisma where */
export function segmentWhere(seg: SegmentKey): Prisma.PartnerWhereInput {
  const base: Prisma.PartnerWhereInput = { status: "approved" };
  const since = new Date(Date.now() - DAYS * 86400_000);

  switch (seg) {
    case "new":
      return { ...base, sales: { none: {} } };
    case "active":
      return {
        ...base,
        OR: [{ lastLoginAt: { gte: since } }, { sales: { some: { orderedAt: { gte: since } } } }],
      };
    case "dormant":
      return { ...base, OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: since } }] };
    case "vip":
      // 컨시어지 등 커스텀 상위 등급 or 누적 수수료 기준 (수수료는 후처리)
      return base;
    case "all":
    default:
      return base;
  }
}

export async function segmentCount(seg: SegmentKey): Promise<number> {
  if (seg === "vip") return countVip();
  return prisma.partner.count({ where: segmentWhere(seg) });
}

async function countVip(): Promise<number> {
  const rows = await prisma.partner.findMany({
    where: { status: "approved" },
    select: { id: true, sales: { select: { commission: true, status: true } } },
  });
  return rows.filter((p) => {
    const sum = p.sales.filter((s) => s.status === "confirmed").reduce((a, b) => a + b.commission, 0);
    return sum >= VIP_COMMISSION;
  }).length;
}

/** 세그먼트에 속한 파트너(발송 대상) — 전화번호 포함 */
export async function resolveSegment(seg: SegmentKey) {
  if (seg === "vip") {
    const rows = await prisma.partner.findMany({
      where: { status: "approved" },
      select: { id: true, name: true, phone: true, channelFriend: true, sales: { select: { commission: true, status: true } } },
    });
    return rows
      .filter((p) => p.sales.filter((s) => s.status === "confirmed").reduce((a, b) => a + b.commission, 0) >= VIP_COMMISSION)
      .map(({ sales, ...p }) => p);
  }
  return prisma.partner.findMany({
    where: segmentWhere(seg),
    select: { id: true, name: true, phone: true, channelFriend: true },
  });
}
