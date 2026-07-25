// 타임세일 — 단일 설정 + 상태 판정
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

/** 상태 판정 (서버 시간 기준) */
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
  if (s != null && t < s) return "upcoming"; // 예약된 오픈 대기
  return "upcoming"; // 창이 없거나 종료됨 → 다음 오픈 대기
}

/** 상품별 적용 할인율(%) — 개별값 우선, 없으면 세일 기본값 */
export function effectiveDiscount(itemDiscount: number | null, baseDiscount: number): number {
  const d = itemDiscount ?? baseDiscount;
  return Math.max(0, Math.min(99, d));
}

/** 할인 적용가 (원 단위 반올림) */
export function timeSalePrice(salePrice: number | null | undefined, discount: number): number | null {
  if (salePrice == null) return null;
  return Math.round((salePrice * (100 - discount)) / 100);
}

/** 배너에 넘길 요약 (상품 포함) */
export async function getTimeSaleForShop() {
  const ts = await prisma.timeSale.findUnique({
    where: { id: "main" },
    include: {
      products: {
        orderBy: { sort: "asc" },
        include: { product: true },
      },
    },
  });
  if (!ts) return null;
  const items = ts.products
    .filter((p) => p.product.active)
    .map((p) => {
      const disc = effectiveDiscount(p.discount, ts.baseDiscount);
      return {
        product: p.product,
        discount: disc,
        salePrice: p.product.salePrice,
        dealPrice: timeSalePrice(p.product.salePrice, disc),
      };
    });
  const state = resolveState(ts, items.length);
  return { ts, items, state };
}
