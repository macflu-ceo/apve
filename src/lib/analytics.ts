// 플랫폼 애널리틱스 — 파트너 활성화 퍼널(방문→가입→코드생성→판매) 지표.
// 트래픽(순수 방문/페이지뷰)은 Vercel Analytics를 사용하고, 여기서는
// 우리 DB에 쌓이는 "비즈니스 이벤트"를 기간별로 집계한다.
import { Prisma } from "@prisma/client";
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

// bigint(Postgres COUNT) → number 안전 변환
function num(v: unknown): number {
  return typeof v === "bigint" ? Number(v) : Number(v ?? 0);
}

// 'YYYY-MM-DD' 에 n일 더한 날짜 문자열
function addDays(d: string, n: number): string {
  const dt = new Date(`${d}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

type PF = "web" | "app" | undefined;
const pfSql = (p: PF) => (p ? Prisma.sql`AND platform = ${p}` : Prisma.empty);

// ── 1) 활성 사용자 (DAU/WAU/MAU + 고착도) ──
export interface ActiveUsers {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number; // DAU/MAU %
}
export async function getActiveUsers(asOf: string, platform?: PF): Promise<ActiveUsers> {
  const mauFrom = addDays(asOf, -29);
  const wauFrom = addDays(asOf, -6);
  const r = await prisma.$queryRaw<{ dau: bigint; wau: bigint; mau: bigint }[]>`
    SELECT
      COUNT(DISTINCT "visitorId") FILTER (WHERE day = ${asOf}) AS dau,
      COUNT(DISTINCT "visitorId") FILTER (WHERE day >= ${wauFrom} AND day <= ${asOf}) AS wau,
      COUNT(DISTINCT "visitorId") FILTER (WHERE day >= ${mauFrom} AND day <= ${asOf}) AS mau
    FROM "Visit"
    WHERE day >= ${mauFrom} AND day <= ${asOf} ${pfSql(platform)}`;
  const dau = num(r[0]?.dau), wau = num(r[0]?.wau), mau = num(r[0]?.mau);
  return { dau, wau, mau, stickiness: mau > 0 ? (dau / mau) * 100 : 0 };
}

// ── 2) 코호트 리텐션 (첫 방문 주차별, W0~W6 잔존) ──
export interface Cohort {
  week: string; // 코호트 시작(월요일)
  size: number; // W0 인원
  retention: number[]; // [W0%, W1%, ...] 최대 7개
  counts: number[]; // 각 주차 실인원
}
export async function getCohorts(asOf: string, platform?: PF): Promise<Cohort[]> {
  const cutoff = addDays(asOf, -7 * 8); // 최근 8주 코호트
  const pf = pfSql(platform);
  const rows = await prisma.$queryRaw<{ cohort: string; wk: number; users: bigint }[]>`
    WITH firsts AS (
      SELECT "visitorId", MIN(day)::date AS fd
      FROM "Visit" WHERE TRUE ${pf} GROUP BY "visitorId"
    ), base AS (
      SELECT v."visitorId",
        date_trunc('week', f.fd)::date AS cohort_start,
        ((v.day::date - date_trunc('week', f.fd)::date) / 7)::int AS wk
      FROM "Visit" v JOIN firsts f ON f."visitorId" = v."visitorId"
      WHERE TRUE ${pf}
    )
    SELECT to_char(cohort_start, 'YYYY-MM-DD') AS cohort, wk, COUNT(DISTINCT "visitorId") AS users
    FROM base
    WHERE cohort_start >= ${cutoff}::date AND wk BETWEEN 0 AND 6
    GROUP BY cohort_start, wk
    ORDER BY cohort_start DESC, wk ASC`;

  const map = new Map<string, Map<number, number>>();
  for (const r of rows) {
    if (!map.has(r.cohort)) map.set(r.cohort, new Map());
    map.get(r.cohort)!.set(r.wk, num(r.users));
  }
  const out: Cohort[] = [];
  for (const [week, wkMap] of map) {
    const size = wkMap.get(0) ?? 0;
    const counts: number[] = [];
    const retention: number[] = [];
    for (let k = 0; k <= 6; k++) {
      const c = wkMap.get(k) ?? 0;
      counts.push(c);
      retention.push(size > 0 ? (c / size) * 100 : 0);
    }
    out.push({ week, size, retention, counts });
  }
  return out; // 최신 코호트 먼저
}

// ── 3) 방문자 기준 퍼널 (방문→상품조회→코드생성) ──
export interface VisitorFunnel {
  visitors: number;
  viewers: number; // 상품 상세 본 방문자
  coders: number; // 코드 생성한 방문자
}
export async function getVisitorFunnel(from: string, to: string, platform?: PF): Promise<VisitorFunnel> {
  const r = await prisma.$queryRaw<{ visitors: bigint; viewers: bigint; coders: bigint }[]>`
    SELECT
      COUNT(DISTINCT "visitorId") AS visitors,
      COUNT(DISTINCT "visitorId") FILTER (WHERE kind = 'product') AS viewers,
      COUNT(DISTINCT "visitorId") FILTER (WHERE label = 'code') AS coders
    FROM "Visit"
    WHERE day >= ${from} AND day <= ${to} ${pfSql(platform)}`;
  return { visitors: num(r[0]?.visitors), viewers: num(r[0]?.viewers), coders: num(r[0]?.coders) };
}

// ── 4) 유입 경로 (리퍼러 · UTM 캠페인) ──
export interface Acquisition {
  referrers: { referrer: string; sessions: number }[];
  campaigns: { source: string; campaign: string | null; sessions: number }[];
  referredSessions: number; // 외부 유입 세션 합
}
export async function getAcquisition(from: string, to: string, platform?: PF): Promise<Acquisition> {
  const pf = pfSql(platform);
  const [refs, utms] = await Promise.all([
    prisma.$queryRaw<{ referrer: string; n: number }[]>`
      SELECT referrer, COUNT(*)::int AS n FROM "Visit"
      WHERE day >= ${from} AND day <= ${to} AND referrer IS NOT NULL ${pf}
      GROUP BY referrer ORDER BY n DESC LIMIT 12`,
    prisma.$queryRaw<{ source: string; campaign: string | null; n: number }[]>`
      SELECT "utmSource" AS source, "utmCampaign" AS campaign, COUNT(*)::int AS n FROM "Visit"
      WHERE day >= ${from} AND day <= ${to} AND "utmSource" IS NOT NULL ${pf}
      GROUP BY "utmSource", "utmCampaign" ORDER BY n DESC LIMIT 12`,
  ]);
  return {
    referrers: refs.map((r) => ({ referrer: r.referrer, sessions: r.n })),
    campaigns: utms.map((u) => ({ source: u.source, campaign: u.campaign, sessions: u.n })),
    referredSessions: refs.reduce((s, r) => s + r.n, 0),
  };
}

export interface DailyPoint {
  day: string;
  visitors: number;    // 순 방문자(유니크)
  returning: number;   // 그 중 재방문(기간 내 2일 이상 방문)
  sessions: number;    // 방문 횟수(세션)
  pageViews: number;   // 페이지뷰(전체 = 일반 + 상품)
  productViews: number;// 상품 조회
  clicks: number;      // 주요 액션 클릭(코드생성/AI 등)
}

/** 일자별 트래픽·리텐션 시계열 (Visit 로그 기반). platform: web|app|undefined(전체) */
export async function getDailySeries(from: string, to: string, platform?: "web" | "app"): Promise<DailyPoint[]> {
  const pf = platform ? Prisma.sql`AND platform = ${platform}` : Prisma.empty;
  const pfV = platform ? Prisma.sql`AND v.platform = ${platform}` : Prisma.empty;
  const [agg, ret] = await Promise.all([
    prisma.$queryRaw<
      { day: string; visitors: bigint; sessions: bigint; page_views: bigint; product_views: bigint; clicks: bigint }[]
    >`
      SELECT day,
        COUNT(DISTINCT "visitorId") AS visitors,
        COUNT(DISTINCT "sessionId") AS sessions,
        COUNT(*) FILTER (WHERE kind IN ('page','product')) AS page_views,
        COUNT(*) FILTER (WHERE kind = 'product') AS product_views,
        COUNT(*) FILTER (WHERE kind = 'click') AS clicks
      FROM "Visit"
      WHERE day >= ${from} AND day <= ${to} ${pf}
      GROUP BY day`,
    // 재방문: 그 날 방문자 중 '그 이전에도' 방문한 적 있는 사람 수
    prisma.$queryRaw<{ day: string; returning: bigint }[]>`
      SELECT v.day, COUNT(DISTINCT v."visitorId") AS returning
      FROM "Visit" v
      WHERE v.day >= ${from} AND v.day <= ${to} ${pfV}
        AND EXISTS (
          SELECT 1 FROM "Visit" p
          WHERE p."visitorId" = v."visitorId" AND p.day < v.day
        )
      GROUP BY v.day`,
  ]);

  const retMap = new Map(ret.map((r) => [r.day, num(r.returning)]));
  const map = new Map<string, DailyPoint>();
  for (const r of agg) {
    map.set(r.day, {
      day: r.day,
      visitors: num(r.visitors),
      returning: retMap.get(r.day) ?? 0,
      sessions: num(r.sessions),
      pageViews: num(r.page_views),
      productViews: num(r.product_views),
      clicks: num(r.clicks),
    });
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export interface RetentionSummary {
  visitors: number;       // 기간 내 순 방문자
  returningVisitors: number; // 2일 이상 방문한 방문자
  returnRate: number;     // 재방문율 %
  sessions: number;       // 총 방문 횟수
  visitsPerVisitor: number; // 1인당 평균 방문
  pageViews: number;
  pagesPerSession: number; // 세션당 페이지뷰
  loggedInVisitors: number; // 로그인(회원) 방문자 수
}

/** 기간 리텐션 요약. platform: web|app|undefined(전체) */
export async function getRetentionSummary(from: string, to: string, platform?: "web" | "app"): Promise<RetentionSummary> {
  const pf = platform ? Prisma.sql`AND platform = ${platform}` : Prisma.empty;
  const [base, ret] = await Promise.all([
    prisma.$queryRaw<
      { visitors: bigint; sessions: bigint; page_views: bigint; logged_in: bigint }[]
    >`
      SELECT
        COUNT(DISTINCT "visitorId") AS visitors,
        COUNT(DISTINCT "sessionId") AS sessions,
        COUNT(*) FILTER (WHERE kind IN ('page','product')) AS page_views,
        COUNT(DISTINCT "partnerId") FILTER (WHERE "partnerId" IS NOT NULL) AS logged_in
      FROM "Visit"
      WHERE day >= ${from} AND day <= ${to} ${pf}`,
    prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM (
        SELECT "visitorId" FROM "Visit"
        WHERE day >= ${from} AND day <= ${to} ${pf}
        GROUP BY "visitorId" HAVING COUNT(DISTINCT day) >= 2
      ) t`,
  ]);

  const b = base[0] ?? { visitors: 0n, sessions: 0n, page_views: 0n, logged_in: 0n };
  const visitors = num(b.visitors);
  const sessions = num(b.sessions);
  const pageViews = num(b.page_views);
  const returningVisitors = num(ret[0]?.n);

  return {
    visitors,
    returningVisitors,
    returnRate: visitors > 0 ? (returningVisitors / visitors) * 100 : 0,
    sessions,
    visitsPerVisitor: visitors > 0 ? sessions / visitors : 0,
    pageViews,
    pagesPerSession: sessions > 0 ? pageViews / sessions : 0,
    loggedInVisitors: num(b.logged_in),
  };
}

export interface PartnerEngagement {
  sessions: number;     // 방문 횟수
  activeDays: number;   // 방문한 날 수
  pageViews: number;
  productViews: number;
  clicks: number;
  lastVisit: Date | null;
}

/** 회원(파트너)별 방문·활동 집계 — 회원목록 표시/정렬용. 기간 선택 가능. */
export async function getPartnerEngagement(from?: string, to?: string): Promise<Map<string, PartnerEngagement>> {
  const rows = await prisma.$queryRaw<
    {
      partnerId: string;
      sessions: bigint;
      active_days: bigint;
      page_views: bigint;
      product_views: bigint;
      clicks: bigint;
      last_visit: Date | null;
    }[]
  >`
    SELECT "partnerId",
      COUNT(DISTINCT "sessionId") AS sessions,
      COUNT(DISTINCT day) AS active_days,
      COUNT(*) FILTER (WHERE kind IN ('page','product')) AS page_views,
      COUNT(*) FILTER (WHERE kind = 'product') AS product_views,
      COUNT(*) FILTER (WHERE kind = 'click') AS clicks,
      MAX("createdAt") AS last_visit
    FROM "Visit"
    WHERE "partnerId" IS NOT NULL
      ${from ? Prisma.sql`AND day >= ${from}` : Prisma.empty}
      ${to ? Prisma.sql`AND day <= ${to}` : Prisma.empty}
    GROUP BY "partnerId"`;

  const map = new Map<string, PartnerEngagement>();
  for (const r of rows) {
    map.set(r.partnerId, {
      sessions: num(r.sessions),
      activeDays: num(r.active_days),
      pageViews: num(r.page_views),
      productViews: num(r.product_views),
      clicks: num(r.clicks),
      lastVisit: r.last_visit ?? null,
    });
  }
  return map;
}

export interface RankedProduct {
  id: string;
  goodsNo: string;
  name: string;
  brand: string | null;
  views: number;
  links: number;
}

/** 기간별 인기 상품 — 조회수(고유 방문자) / 코드생성수 상위
 * 조회수는 실제 브라우저 방문(Visit kind=product)의 고유 방문자 수로 집계한다.
 * (서버 무한기록 ProductView는 봇에 오염돼 폐기 — 클라이언트 Visit은 봇 필터 적용됨) */
export async function getTopProducts(from: string, to: string, take = 10) {
  const range = { gte: kstStart(from), lte: kstEnd(to) };

  const [viewRows, linkAgg] = await Promise.all([
    prisma.$queryRaw<{ goodsNo: string; viewers: bigint }[]>`
      SELECT "goodsNo", COUNT(DISTINCT "visitorId") AS viewers
      FROM "Visit"
      WHERE kind = 'product' AND "goodsNo" IS NOT NULL AND day >= ${from} AND day <= ${to}
      GROUP BY "goodsNo" ORDER BY viewers DESC LIMIT ${take}`,
    prisma.issuedLink.groupBy({
      by: ["productId"],
      where: { createdAt: range },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take,
    }),
  ]);

  const goodsNos = viewRows.map((v) => v.goodsNo);
  const linkIds = linkAgg.map((l) => l.productId);
  const [byGoods, byId] = await Promise.all([
    goodsNos.length
      ? prisma.product.findMany({ where: { goodsNo: { in: goodsNos } }, select: { id: true, goodsNo: true, name: true, brand: true } })
      : Promise.resolve([]),
    linkIds.length
      ? prisma.product.findMany({ where: { id: { in: linkIds } }, select: { id: true, goodsNo: true, name: true, brand: true } })
      : Promise.resolve([]),
  ]);
  const goodsMap = new Map(byGoods.map((p) => [p.goodsNo, p]));
  const idMap = new Map(byId.map((p) => [p.id, p]));
  const viewerMap = new Map(viewRows.map((v) => [v.goodsNo, num(v.viewers)]));

  const byViews: RankedProduct[] = viewRows.map((v) => {
    const p = goodsMap.get(v.goodsNo);
    return {
      id: p?.id ?? v.goodsNo,
      goodsNo: v.goodsNo,
      name: p?.name ?? "(미동기화 상품)",
      brand: p?.brand ?? null,
      views: num(v.viewers),
      links: 0,
    };
  });
  const byLinks: RankedProduct[] = linkAgg.map((l) => {
    const p = idMap.get(l.productId);
    return {
      id: l.productId,
      goodsNo: p?.goodsNo ?? "-",
      name: p?.name ?? "(삭제됨)",
      brand: p?.brand ?? null,
      views: p?.goodsNo ? viewerMap.get(p.goodsNo) ?? 0 : 0,
      links: l._count._all,
    };
  });

  return { byViews, byLinks };
}

/** 앱 유도(CTA) 장치별 성과 — 노출/클릭/전환율. label=app_cta_<source> 기반. */
export type AppCtaRow = { source: string; label: string; impressions: number; clicks: number; ctr: number };

const CTA_LABELS: Record<string, string> = {
  topbar: "상단 앱설치 바",
  upsell: "수수료 20%↑ 버튼",
  codelimit: "코드복사 한도 도달",
  pop5: "행동 5회 팝업",
  pop20: "행동 20회 팝업",
  pop40: "행동 40회 팝업",
  popup: "일반 팝업",
};

export async function getAppCtaPerformance(from: string, to: string): Promise<AppCtaRow[]> {
  const rows = await prisma.$queryRaw<{ label: string; impressions: bigint; clicks: bigint }[]>`
    SELECT label,
      COUNT(*) FILTER (WHERE kind = 'impression') AS impressions,
      COUNT(*) FILTER (WHERE kind = 'click') AS clicks
    FROM "Visit"
    WHERE label LIKE 'app_cta_%' AND day >= ${from} AND day <= ${to}
    GROUP BY label`;
  return rows
    .map((r) => {
      const source = r.label.replace(/^app_cta_/, "");
      const impressions = num(r.impressions);
      const clicks = num(r.clicks);
      return {
        source,
        label: CTA_LABELS[source] ?? source,
        impressions,
        clicks,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks);
}
