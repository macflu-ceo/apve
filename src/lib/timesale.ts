// 골든타임 — 한정 시간 수수료 부스트. 단일 설정 + 상태 판정.
//   off      : 노출 꺼짐 또는 상품 없음
//   upcoming : 오픈 예정(예약된 시작 전) 또는 종료 후 (다음 오픈 대기)
//   live     : 시작~종료 사이 진행중
import { prisma } from "@/lib/db";

export type TimeSaleState = "off" | "upcoming" | "live";

export async function getTimeSaleConfig() {
  return prisma.timeSale.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" },
  });
}

export function resolveState(
  ts: { active: boolean; startAt: Date | null; endAt: Date | null },
  productCount: number,
  now = new Date()
): TimeSaleState {
  if (!ts.active || productCount === 0) return "off";
  const s = ts.startAt?.getTime();
  const e = ts.endAt?.getTime();
  const t = now.getTime();
  if (s != null && e != null && t >= s && t < e) return "live";
  if (s != null && t < s) return "upcoming";
  return "upcoming";
}

/** 상품별 적용 부스트(%p) — 개별값 우선, 없으면 기본값 */
export function effectiveBoost(itemBoost: number | null, baseBoost: number): number {
  const b = itemBoost ?? baseBoost;
  return Math.max(0, Math.min(90, b));
}

/** 배너·페이지에 넘길 요약 (상품 + 부스트 포함) */
export async function getTimeSaleForShop() {
  const ts = await prisma.timeSale.findUnique({
    where: { id: "main" },
    include: { products: { orderBy: { sort: "asc" }, include: { product: true } } },
  });
  if (!ts) return null;
  const items = ts.products
    .filter((p) => p.product.active)
    .map((p) => ({ product: p.product, boost: effectiveBoost(p.boost, ts.baseBoost) }));
  const state = resolveState(ts, items.length);
  // 배너 문구용 대표 부스트 (최대값)
  const maxBoost = items.reduce((m, it) => Math.max(m, it.boost), 0);
  return { ts, items, state, maxBoost };
}

/** 특정 상품이 지금 진행중인 골든타임에 포함되면 부스트(%p) 반환, 아니면 0 */
export async function activeBoostForProduct(productId: string, now = new Date()): Promise<number> {
  const ts = await prisma.timeSale.findUnique({
    where: { id: "main" },
    include: { products: { where: { productId } } },
  });
  if (!ts) return 0;
  if (resolveState(ts, ts.products.length, now) !== "live") return 0;
  const item = ts.products[0];
  if (!item) return 0;
  return effectiveBoost(item.boost, ts.baseBoost);
}

/** 진행중 골든타임을 이력(MarginUpWindow)으로 스냅샷 — 정산 정확도용 */
export async function snapshotWindow() {
  const ts = await prisma.timeSale.findUnique({
    where: { id: "main" },
    include: { products: true },
  });
  if (!ts || !ts.startAt || !ts.endAt) return;
  const map: Record<string, number> = {};
  for (const p of ts.products) map[p.productId] = effectiveBoost(p.boost, ts.baseBoost);
  await prisma.marginUpWindow.create({
    data: {
      startAt: ts.startAt,
      endAt: ts.endAt,
      baseBoost: ts.baseBoost,
      productsJson: JSON.stringify(map),
    },
  });
}

/**
 * 판매 시각·상품 기준으로 적용할 부스트(%p)를 이력에서 찾는다. (정산 시 사용)
 * windows: 미리 조회해둔 MarginUpWindow 목록
 */
export function boostFromWindows(
  windows: { startAt: Date; endAt: Date; productsJson: string }[],
  productId: string | null,
  orderedAt: Date
): number {
  if (!productId) return 0;
  const t = orderedAt.getTime();
  let best = 0;
  for (const w of windows) {
    if (t < w.startAt.getTime() || t >= w.endAt.getTime()) continue;
    try {
      const map = JSON.parse(w.productsJson) as Record<string, number>;
      const b = map[productId];
      if (typeof b === "number") best = Math.max(best, b);
    } catch {
      /* skip */
    }
  }
  return best;
}
