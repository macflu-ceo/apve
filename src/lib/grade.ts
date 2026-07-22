// 회원 등급 — 수수료율(%)이 등급에 귀속된다.
//  · 첫구매(systemKey=first): 판매실적 0건일 때 자동
//  · 일반(systemKey=normal): 판매 1건부터 자동
//  · 그 외(컨시어지 등): 어드민이 파트너에게 수동 지정
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";

export const DEFAULT_GRADES = [
  { name: "첫구매", percent: 20, systemKey: "first", sort: 0 },
  { name: "일반", percent: 7, systemKey: "normal", sort: 1 },
  { name: "컨시어지", percent: 13, systemKey: null as string | null, sort: 2 },
];

/** 기본 등급 3개가 없으면 생성 */
export async function ensureDefaultGrades() {
  for (const g of DEFAULT_GRADES) {
    const exists = g.systemKey
      ? await prisma.grade.findUnique({ where: { systemKey: g.systemKey } })
      : await prisma.grade.findUnique({ where: { name: g.name } });
    if (!exists) await prisma.grade.create({ data: g });
  }
}

export async function listGrades() {
  await ensureDefaultGrades();
  return prisma.grade.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
}

/** 파트너의 현재 등급 (수동 지정 우선 → 없으면 판매실적으로 자동 판정) */
export async function getPartnerGrade(partnerId: string) {
  await ensureDefaultGrades();
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: { grade: true },
  });
  if (!partner) return null;
  if (partner.grade) return partner.grade; // 어드민 수동 지정

  const sales = await prisma.sale.count({ where: { partnerId, status: "confirmed" } });
  const key = sales > 0 ? "normal" : "first";
  return prisma.grade.findUnique({ where: { systemKey: key } });
}

/** 상품 목록/상세에서 보여줄 수수료율 — 로그인 시 내 등급, 비로그인 시 최고 등급 */
export async function getViewerRate(): Promise<{
  percent: number;
  gradeName: string | null;
  isMine: boolean;
}> {
  await ensureDefaultGrades();
  const partner = await getSessionPartner();
  if (partner) {
    const g = await getPartnerGrade(partner.id);
    if (g) return { percent: g.percent, gradeName: g.name, isMine: true };
  }
  const top = await prisma.grade.findFirst({ orderBy: { percent: "desc" } });
  return { percent: top?.percent ?? 0, gradeName: null, isMine: false };
}

/** 금액 × 퍼센트 → 수수료(원) */
export function commissionOf(amount: number | null | undefined, percent: number): number | null {
  if (amount == null) return null;
  return Math.round((amount * percent) / 100);
}
