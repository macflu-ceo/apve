// 20% 보상 바우처 — 지급/적용/소진/집계.
// 라이프사이클: available(지급) → applied(회원이 상품에 적용) → used(그 상품 최초 판매로 소진, 20% 적용)
import { prisma } from "@/lib/db";

/** 바우처 지급 (커뮤니티 보상 등) */
export async function grantVoucher(partnerId: string, reason: string, sourcePostId?: string) {
  return prisma.rewardVoucher.create({
    data: { partnerId, reason, sourcePostId: sourcePostId ?? null },
  });
}

export interface VoucherCounts {
  available: number;
  applied: number;
  used: number;
  total: number;
}

/** 회원별 바우처 상태 집계 */
export async function voucherCounts(partnerId: string): Promise<VoucherCounts> {
  const rows = await prisma.rewardVoucher.groupBy({
    by: ["status"],
    where: { partnerId },
    _count: { _all: true },
  });
  const get = (s: string) => rows.find((r) => r.status === s)?._count._all ?? 0;
  const available = get("available");
  const applied = get("applied");
  const used = get("used");
  return { available, applied, used, total: available + applied + used };
}

/**
 * 회원이 특정 상품에 바우처 적용 (버튼).
 *  · 사용가능 바우처 1개를 그 상품에 배정 → 그 상품 최초 판매 시 20% 적용
 *  · 같은 상품에 이미 적용중이면 거부, 사용가능 바우처 없으면 거부
 */
export async function applyVoucherToProduct(
  partnerId: string,
  productId: string
): Promise<{ ok: boolean; message: string }> {
  const dup = await prisma.rewardVoucher.findFirst({
    where: { partnerId, productId, status: { in: ["applied", "used"] } },
    select: { id: true, status: true },
  });
  if (dup) {
    return {
      ok: false,
      message: dup.status === "used" ? "이미 이 상품에서 20%가 적용됐어요." : "이미 이 상품에 적용 중이에요.",
    };
  }
  const v = await prisma.rewardVoucher.findFirst({
    where: { partnerId, status: "available" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!v) return { ok: false, message: "사용 가능한 20% 바우처가 없어요." };

  await prisma.rewardVoucher.update({
    where: { id: v.id },
    data: { status: "applied", productId, appliedAt: new Date() },
  });
  return { ok: true, message: "이 상품에 20% 바우처를 적용했어요! 최초 판매 1건에 20%가 적용됩니다." };
}

/** 적용 취소 (아직 판매 전) — applied → available */
export async function unapplyVoucher(partnerId: string, voucherId: string) {
  const v = await prisma.rewardVoucher.findFirst({
    where: { id: voucherId, partnerId, status: "applied" },
    select: { id: true },
  });
  if (!v) return { ok: false, message: "취소할 수 없는 바우처입니다." };
  await prisma.rewardVoucher.update({
    where: { id: v.id },
    data: { status: "available", productId: null, appliedAt: null },
  });
  return { ok: true, message: "적용을 취소했어요." };
}

/**
 * 판매 동기화 후 호출 — applied 바우처를 해당 상품의 최초 미소진 판매에 소진시키고 20% 적용.
 * 반환: 소진 처리한 건수.
 */
export async function consumeVouchersForSales(): Promise<number> {
  const applied = await prisma.rewardVoucher.findMany({
    where: { status: "applied", productId: { not: null } },
    select: { id: true, partnerId: true, productId: true, appliedAt: true },
  });
  let consumed = 0;
  for (const v of applied) {
    if (!v.productId) continue;
    // 그 회원·그 상품의 확정 판매 중 아직 20% 안 붙은 최초 1건
    const sale = await prisma.sale.findFirst({
      where: { partnerId: v.partnerId, productId: v.productId, status: "confirmed", boost20: false },
      orderBy: { orderedAt: "asc" },
      select: { id: true, amount: true },
    });
    if (!sale) continue;
    // 판매를 20%로: 커미션 재계산 + 배지
    await prisma.$transaction([
      prisma.sale.update({
        where: { id: sale.id },
        data: { boost20: true, commission: Math.round((sale.amount * 20) / 100) },
      }),
      prisma.rewardVoucher.update({
        where: { id: v.id },
        data: { status: "used", saleId: sale.id, usedAt: new Date() },
      }),
    ]);
    consumed++;
  }
  return consumed;
}
