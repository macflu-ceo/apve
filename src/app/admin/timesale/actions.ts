"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

function revalidate() {
  revalidatePath("/admin/timesale");
  revalidatePath("/");
  revalidatePath("/timesale");
}

type SaveInput = {
  title: string;
  upcomingText: string;
  liveText: string;
  baseDiscount: number;
  active: boolean;
  /** 선택 상품 + 개별 할인율(null이면 기본) — 배치 순서 유지 */
  items: { productId: string; discount: number | null }[];
};

/** 설정·상품·할인 저장 (오픈/종료 시각은 건드리지 않음) */
export async function saveTimeSale(input: SaveInput) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };

  await prisma.timeSale.upsert({
    where: { id: "main" },
    update: {
      title: input.title || "⚡ TIME SALE",
      upcomingText: input.upcomingText,
      liveText: input.liveText,
      baseDiscount: Math.max(0, Math.min(99, Math.round(input.baseDiscount))),
      active: input.active,
    },
    create: {
      id: "main",
      title: input.title || "⚡ TIME SALE",
      upcomingText: input.upcomingText,
      liveText: input.liveText,
      baseDiscount: Math.max(0, Math.min(99, Math.round(input.baseDiscount))),
      active: input.active,
    },
  });

  // 상품 목록 교체
  await prisma.timeSaleProduct.deleteMany({ where: { timeSaleId: "main" } });
  if (input.items.length > 0) {
    await prisma.timeSaleProduct.createMany({
      data: input.items.map((it, i) => ({
        timeSaleId: "main",
        productId: it.productId,
        sort: i,
        discount: it.discount == null ? null : Math.max(0, Math.min(99, Math.round(it.discount))),
      })),
    });
  }

  revalidate();
  return { ok: true, message: "저장되었습니다." };
}

/** 지금 오픈 — 지금부터 hours시간 동안 진행 */
export async function openNow(hours: number) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const h = Math.max(0.1, Math.min(720, hours)); // 0.1~720시간
  const start = new Date();
  const end = new Date(start.getTime() + h * 3600_000);
  await prisma.timeSale.update({
    where: { id: "main" },
    data: { active: true, startAt: start, endAt: end },
  });
  revalidate();
  return { ok: true, message: `${h}시간 타임세일을 오픈했습니다.` };
}

/** 예약 오픈 — 특정 시각부터 hours시간 (오픈 예정 카운트다운 노출) */
export async function scheduleOpen(startISO: string, hours: number) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return { ok: false, message: "시작 시각이 올바르지 않습니다." };
  const h = Math.max(0.1, Math.min(720, hours));
  const end = new Date(start.getTime() + h * 3600_000);
  await prisma.timeSale.update({
    where: { id: "main" },
    data: { active: true, startAt: start, endAt: end },
  });
  revalidate();
  return { ok: true, message: "예약 오픈이 설정되었습니다." };
}

/** 즉시 종료 */
export async function endNow() {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.timeSale.update({
    where: { id: "main" },
    data: { endAt: new Date() },
  });
  revalidate();
  return { ok: true, message: "타임세일을 종료했습니다." };
}
