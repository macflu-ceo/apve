// 플랫폼 애널리틱스 — 파트너 활성화 퍼널(방문→가입→코드생성→판매) 지표.
// 트래픽(순수 방문/페이지뷰)은 Vercel Analytics를 사용하고, 여기서는
// 우리 DB에 쌓이는 "비즈니스 이벤트"를 기간별로 집계한다.
import { prisma } from "@/lib/db";

/** 상품 조회 1건 기록 (상세페이지 진입). 실패해도 무시(비차단). */
export async function logProductView(productId: string, partnerId?: string | null) {
  try {
    await prisma.$transaction([
      prisma.productView.create({ data: { productId, partnerId: partnerId ?? null } }),
      prisma.product.update({ where: { id: productId }, data: { views: { increment: 1 } } }),
    ]);
  } catch {
    // 조회 로깅 실패는 페이지 렌더를 막지 않는다
  }
}

function kstStart(d: string) {
  return new Date(`${d}T00:00:00+09:00`);
}
function kstEnd(d: string) {
  return new Date(`${d}T23:59:59.999+09:00`);
}

export interface FunnelResult {
  signups: number;       // 신규 가입
  productViews: number;  // 상품 조회
  linksCreated: number;  // 내 코드 만들기
  salesCount: number;    // 판매 건수(확정)
  salesAmount: number;   // 판매 매출(확정)
  commission: number;    // 확정 수수료
}

/** 기간별 퍼널 집계 */
export async function getFunnel(from: string, to: string): Promise<FunnelResult> {
  const gte = kstStart(from);
  const lte = kstEnd(to);
  const range = { gte, lte };

  const [signups, productViews, linksCreated, sales] = await Promise.all([
    prisma.partner.count({ where: { createdAt: range } }),
    prisma.productView.count({ where: { createdAt: range } }),
    prisma.issuedLink.count({ where: { createdAt: range } }),
    prisma.sale.aggregate({
      where: { orderedAt: range, status: "confirmed" },
      _count: { _all: true },
      _sum: { amount: true, commission: true },
    }),
  ]);

  return {
    signups,
    productViews,
    linksCreated,
    salesCount: sales._count._all,
    salesAmount: sales._sum.amount ?? 0,
    commission: sales._sum.commission ?? 0,
  };
}

export interface RankedProduct {
  id: string;
  goodsNo: string;
  name: string;
  brand: string | null;
  views: number;
  links: number;
}

/** 기간별 인기 상품 — 조회수 / 코드생성수 상위 */
export async function getTopProducts(from: string, to: string, take = 10) {
  const range = { gte: kstStart(from), lte: kstEnd(to) };

  const [viewsAgg, linkAgg] = await Promise.all([
    prisma.productView.groupBy({
      by: ["productId"],
      where: { createdAt: range },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take,
    }),
    prisma.issuedLink.groupBy({
      by: ["productId"],
      where: { createdAt: range },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take,
    }),
  ]);

  const ids = [...new Set([...viewsAgg.map((v) => v.productId), ...linkAgg.map((l) => l.productId)])];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, goodsNo: true, name: true, brand: true },
  });
  const pmap = new Map(products.map((p) => [p.id, p]));
  const viewMap = new Map(viewsAgg.map((v) => [v.productId, v._count._all]));
  const linkMap = new Map(linkAgg.map((l) => [l.productId, l._count._all]));

  const byViews: RankedProduct[] = viewsAgg.map((v) => {
    const p = pmap.get(v.productId);
    return {
      id: v.productId,
      goodsNo: p?.goodsNo ?? "-",
      name: p?.name ?? "(삭제됨)",
      brand: p?.brand ?? null,
      views: v._count._all,
      links: linkMap.get(v.productId) ?? 0,
    };
  });
  const byLinks: RankedProduct[] = linkAgg.map((l) => {
    const p = pmap.get(l.productId);
    return {
      id: l.productId,
      goodsNo: p?.goodsNo ?? "-",
      name: p?.name ?? "(삭제됨)",
      brand: p?.brand ?? null,
      views: viewMap.get(l.productId) ?? 0,
      links: l._count._all,
    };
  });

  return { byViews, byLinks };
}
