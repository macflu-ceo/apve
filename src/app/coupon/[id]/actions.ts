"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** 고객이 방문 예약 (로그인 불필요, 쿠폰 id로) */
export async function reserveVisit(couponId: string, date: string, time: string) {
  if (!date || !time) return { ok: false as const, message: "날짜와 시간을 선택하세요." };
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId }, select: { id: true, status: true } });
  if (!coupon || coupon.status !== "issued") return { ok: false as const, message: "예약할 수 없는 권한입니다." };
  await prisma.couponReservation.upsert({
    where: { couponId },
    update: { date, time, status: "reserved" },
    create: { couponId, date, time },
  });
  revalidatePath(`/coupon/${couponId}`);
  return { ok: true as const, message: "방문 예약이 접수되었습니다." };
}
