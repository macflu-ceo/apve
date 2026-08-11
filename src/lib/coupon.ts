import { prisma } from "@/lib/db";
import { conciergeCode } from "@/lib/concierge-access";

const pad4 = (n: number) => String(n).padStart(4, "0");

/** 쿠폰 코드: {매장}{컨시어지3자리}{가격구분}-{일련4자리}  예) cd001cp-0731 */
export function couponCode(storeCode: string, conciergeNo: number, priceType: string, serial: number) {
  return `${storeCode}${conciergeCode(conciergeNo)}${priceType}-${pad4(serial)}`;
}

export type IssueInput = {
  storeId: string;
  priceType: "cp" | "ws";
  customerName: string;
  customerPhone: string;
  benefitText: string;
  brandsText?: string;
  conditions?: string;
  startAt: Date;
  endAt: Date;
};

/** 컨시어지가 쿠폰 발급 — 매장+컨시어지 범위로 일련번호 채번, 코드 생성 */
export async function issueCoupon(
  concierge: { id: string; name: string; conciergeNo: number },
  input: IssueInput
) {
  const store = await prisma.store.findUnique({ where: { id: input.storeId } });
  if (!store || !store.active) throw new Error("매장을 찾을 수 없습니다.");

  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await prisma.coupon.findFirst({
      where: { storeId: store.id, conciergeId: concierge.id },
      orderBy: { serial: "desc" },
      select: { serial: true },
    });
    const serial = (last?.serial ?? 0) + 1 + attempt;
    const code = couponCode(store.code, concierge.conciergeNo, input.priceType, serial);
    try {
      return await prisma.coupon.create({
        data: {
          code,
          storeId: store.id,
          conciergeId: concierge.id,
          conciergeNo: concierge.conciergeNo,
          conciergeName: concierge.name,
          priceType: input.priceType,
          serial,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.replace(/[^0-9]/g, ""),
          benefitText: input.benefitText.trim(),
          brandsText: input.brandsText?.trim() || null,
          conditions: input.conditions?.trim() || null,
          startAt: input.startAt,
          endAt: input.endAt,
        },
      });
    } catch {
      /* code unique 충돌 → 재채번 */
    }
  }
  throw new Error("코드 발급에 실패했습니다. 다시 시도해주세요.");
}

/** 쿠폰 상태 판정 (만료 반영) */
export function couponState(c: { status: string; endAt: Date }): "used" | "expired" | "canceled" | "valid" {
  if (c.status === "used") return "used";
  if (c.status === "canceled") return "canceled";
  if (c.endAt.getTime() < Date.now()) return "expired";
  return "valid";
}

/** D-day (종료일까지 남은 일수) */
export function dday(endAt: Date): number {
  const ms = new Date(endAt.toISOString().slice(0, 10)).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime();
  return Math.round(ms / 86400000);
}
