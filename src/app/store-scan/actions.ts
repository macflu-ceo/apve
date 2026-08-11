"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

const COOKIE = "store_scan";

/** PIN 검증 → 일치하는 매장의 스캔 세션 쿠키 설정 */
export async function verifyStorePin(pin: string) {
  const p = pin.trim();
  if (!p) return { ok: false as const, message: "PIN을 입력하세요." };
  const stores = await prisma.store.findMany({ where: { active: true, pinHash: { not: null } }, select: { id: true, pinHash: true } });
  const match = stores.find((s) => s.pinHash && verifyPassword(p, s.pinHash));
  if (!match) return { ok: false as const, message: "PIN이 올바르지 않습니다." };
  const jar = await cookies();
  jar.set(COOKIE, match.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return { ok: true as const };
}

export async function storeLogout() {
  (await cookies()).delete(COOKIE);
  return { ok: true };
}

async function currentStoreId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

/** 쿠폰 조회 (id 또는 code). 스캔 세션 필요. */
export async function lookupCoupon(idOrCode: string) {
  const storeId = await currentStoreId();
  if (!storeId) return { ok: false as const, message: "매장 인증이 필요합니다." };
  const key = idOrCode.trim();
  const c = await prisma.coupon.findFirst({
    where: { OR: [{ id: key }, { code: key }] },
    include: { store: true, reservation: true },
  });
  if (!c) return { ok: false as const, message: "해당 권한을 찾을 수 없습니다." };
  const state = c.status === "used" ? "used" : c.status === "canceled" ? "canceled" : c.endAt.getTime() < Date.now() ? "expired" : "valid";
  return {
    ok: true as const,
    coupon: {
      id: c.id,
      code: c.code,
      customerName: c.customerName,
      phoneLast4: c.customerPhone.slice(-4),
      benefitText: c.benefitText,
      brandsText: c.brandsText,
      conciergeName: c.conciergeName,
      priceType: c.priceType,
      storeName: c.store.name,
      endAt: c.endAt.toISOString().slice(0, 10),
      state,
    },
  };
}

/** 사용 처리 — 원자적. issued & 미만료만 처리(중복·만료 차단) */
export async function markCouponUsed(couponId: string, purchaseAmount?: number) {
  const storeId = await currentStoreId();
  if (!storeId) return { ok: false as const, message: "매장 인증이 필요합니다." };
  const res = await prisma.coupon.updateMany({
    where: { id: couponId, status: "issued", endAt: { gte: new Date() } },
    data: { status: "used", usedAt: new Date(), usedStorePin: true, purchaseAmount: purchaseAmount && purchaseAmount > 0 ? purchaseAmount : null },
  });
  if (res.count !== 1) {
    // 실패 사유 판정
    const c = await prisma.coupon.findUnique({ where: { id: couponId }, select: { status: true, endAt: true } });
    if (!c) return { ok: false as const, message: "권한을 찾을 수 없습니다." };
    if (c.status === "used") return { ok: false as const, message: "이미 사용된 권한입니다." };
    if (c.endAt.getTime() < Date.now()) return { ok: false as const, message: "유효 기간이 지났습니다." };
    return { ok: false as const, message: "처리할 수 없습니다." };
  }
  // 예약이 있으면 방문완료 처리
  await prisma.couponReservation.updateMany({ where: { couponId, status: { in: ["reserved"] } }, data: { status: "visited" } });
  return { ok: true as const, message: "사용 처리되었습니다." };
}
