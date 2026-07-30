// 회원 등급 — 수수료율(%)이 등급에 귀속된다.
//  · 첫구매(systemKey=first): 판매실적 0건일 때 자동
//  · 일반(systemKey=normal): 판매 1건부터 자동
//  · 그 외(컨시어지 등): 어드민이 파트너에게 수동 지정
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { getPlatform, type Platform } from "@/lib/platform";
import { getSiteSetting } from "@/lib/settings";
import { cache } from "react";

export const DEFAULT_GRADES = [
  { name: "첫구매", percent: 20, systemKey: "first", sort: 0 },
  { name: "일반", percent: 7, systemKey: "normal", sort: 1 },
  { name: "컨시어지", percent: 13, systemKey: null as string | null, sort: 2 },
];

/** 기본 등급 3개가 없으면 생성 (요청당 1회 메모이즈 — 매 호출 DB조회 방지) */
export const ensureDefaultGrades = cache(async () => {
  for (const g of DEFAULT_GRADES) {
    const exists = g.systemKey
      ? await prisma.grade.findUnique({ where: { systemKey: g.systemKey } })
      : await prisma.grade.findUnique({ where: { name: g.name } });
    if (!exists) {
      // 동시 요청이 겹쳐 중복 생성되면 unique 충돌(P2002) — 무시
      try {
        await prisma.grade.create({ data: g });
      } catch {
        /* 이미 다른 요청이 생성함 */
      }
    }
  }
});

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

/**
 * 상품 목록/상세에서 보여줄 수수료율.
 *  · 로그인(승인) → 내 등급, 비로그인/미승인 → 최고 등급('최대 X%')
 *  · 앱 전용 정책: '첫구매' 등급은 **앱에서 원요율(20%) 그대로**, **웹에선 부스트(%p)만큼 차감**.
 *    (최대 표시값은 양 플랫폼 동일. 웹 상세페이지에서 '앱에서 올리기'로 유도)
 * appPercent: 앱 기준 요율(웹이면 유도용). appPremium: 앱−웹 요율차(%p, >0이면 유도 가능)
 */
export async function getViewerRate(): Promise<{
  percent: number;
  appPercent: number;
  gradeName: string | null;
  isMine: boolean;
  platform: Platform;
  appPremium: number;
}> {
  await ensureDefaultGrades();
  const platform = getPlatform();
  const setting = await getSiteSetting();
  const boost = Math.max(0, setting.appBoostPercent ?? 0);
  const partner = await getSessionPartner();

  if (partner && partner.status === "approved") {
    const g = await getPartnerGrade(partner.id);
    if (g) {
      const isFirst = g.systemKey === "first";
      const appPercent = g.percent; // 앱 = 등급 원요율
      const webPercent = isFirst ? Math.max(0, g.percent - boost) : g.percent;
      const percent = platform === "app" ? appPercent : webPercent;
      return {
        percent,
        appPercent,
        gradeName: g.name,
        isMine: true,
        platform,
        appPremium: isFirst ? appPercent - webPercent : 0,
      };
    }
  }
  // 비로그인/미승인 → '최대'는 양 플랫폼 동일하게 최고 등급으로 안내
  const top = await prisma.grade.findFirst({ orderBy: { percent: "desc" } });
  const p = top?.percent ?? 0;
  return { percent: p, appPercent: p, gradeName: null, isMine: false, platform, appPremium: 0 };
}

/** 최고 등급의 수수료율(%) — 예상 수수료 기준값 */
export async function getTopGradePercent(): Promise<number> {
  await ensureDefaultGrades();
  const top = await prisma.grade.findFirst({ orderBy: { percent: "desc" } });
  return top?.percent ?? 0;
}

/** 금액 × 퍼센트 → 수수료(원) */
export function commissionOf(amount: number | null | undefined, percent: number): number | null {
  if (amount == null) return null;
  return Math.round((amount * percent) / 100);
}
