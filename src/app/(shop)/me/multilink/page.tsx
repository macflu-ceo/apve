import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";
import { getPartnerGrade } from "@/lib/grade";
import Manager from "./Manager";

export const dynamic = "force-dynamic";

function firstImage(imagesJson: string | null): string | null {
  try {
    const arr = JSON.parse(imagesJson ?? "[]");
    return Array.isArray(arr) && arr[0] ? String(arr[0]) : null;
  } catch {
    return null;
  }
}

export default async function MultiLinkAdminPage() {
  const partner = await getSessionPartner();
  if (!partner) redirect("/?login=1");
  if (partner.conciergeNo == null) redirect("/concierge"); // 컨시어지 전용 → 가입 안내로

  // 멀티링크 확보
  let ml = await prisma.multiLink.findUnique({ where: { partnerId: partner.id } });
  if (!ml) {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let slug = "";
    for (let attempt = 0; attempt < 20; attempt++) {
      let s = "";
      for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
      if (!(await prisma.multiLink.findUnique({ where: { slug: s }, select: { id: true } }))) { slug = s; break; }
    }
    ml = await prisma.multiLink.create({
      data: { partnerId: partner.id, slug: slug || partner.id.slice(-6), displayName: partner.name },
    });
  }

  const [items, links, leads, grade, sections, banners] = await Promise.all([
    prisma.multiLinkItem.findMany({
      where: { multiLinkId: ml.id },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      include: { product: true },
    }),
    prisma.issuedLink.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      include: { product: true },
      take: 100,
    }),
    prisma.recommendLead.findMany({ where: { multiLinkId: ml.id }, orderBy: { createdAt: "desc" }, take: 100 }),
    getPartnerGrade(partner.id),
    prisma.multiLinkSection.findMany({ where: { multiLinkId: ml.id }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] }),
    prisma.multiLinkBanner.findMany({ where: { multiLinkId: ml.id }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] }),
  ]);

  const percent = grade?.percent ?? 0;
  const inPage = new Set(items.map((i) => i.productId));

  // 내 샵 애널리틱스 — 방문자(고유)·조회수·상품 클릭. /m/슬러그 방문 로그 기준
  const kstDay = (offset = 0) => new Date(Date.now() + 9 * 3600_000 - offset * 86400_000).toISOString().slice(0, 10);
  const mlPath = `/m/${ml.slug}`;
  const statRows = await prisma.$queryRaw<
    { period: string; visitors: bigint; views: bigint; clicks: bigint }[]
  >`
    SELECT p.period,
      COUNT(DISTINCT v."visitorId") FILTER (WHERE v.kind = 'page') AS visitors,
      COUNT(*) FILTER (WHERE v.kind = 'page') AS views,
      COUNT(*) FILTER (WHERE v.kind = 'click' AND v.label = 'ml_item') AS clicks
    FROM (VALUES ('today', ${kstDay(0)}), ('week', ${kstDay(6)}), ('all', '2000-01-01')) AS p(period, from_day)
    LEFT JOIN "Visit" v
      ON (v.path = ${mlPath} OR v.path LIKE ${mlPath + "/%"}) AND v.day >= p.from_day
    GROUP BY p.period`;
  const stat = (period: string) => {
    const r = statRows.find((x) => x.period === period);
    return { visitors: Number(r?.visitors ?? 0), views: Number(r?.views ?? 0), clicks: Number(r?.clicks ?? 0) };
  };
  const shopStats = { today: stat("today"), week: stat("week"), all: stat("all") };

  const toItem = (p: (typeof items)[number]["product"]) => ({
    productId: p.id,
    name: p.name.replace(/^\[[^\]]*\]\s*/, ""),
    brand: p.brand,
    image: firstImage(p.imagesJson),
    salePrice: p.salePrice,
    commission: p.salePrice != null ? Math.round((p.salePrice * percent) / 100) : null,
  });

  return (
    <Manager
      ml={{
        slug: ml.slug,
        displayName: ml.displayName,
        shopTitle: ml.shopTitle ?? "",
        bio: ml.bio ?? "",
        avatarUrl: ml.avatarUrl ?? "",
        coverUrl: ml.coverUrl ?? "",
        views: ml.views,
      }}
      percent={percent}
      stats={shopStats}
      sections={sections.map((s) => ({ id: s.id, title: s.title }))}
      banners={banners.map((b) => ({ id: b.id, imageUrl: b.imageUrl, title: b.title ?? "", sectionId: b.sectionId }))}
      items={items.map((i) => ({ id: i.id, sectionId: i.sectionId, ...toItem(i.product) }))}
      candidates={links.filter((l) => !inPage.has(l.productId) && l.product.active).map((l) => toItem(l.product))}
      leads={leads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        brands: l.brands,
        categories: l.categories,
        ageRange: l.ageRange,
        gender: l.gender,
        budget: l.budget,
        sizes: l.sizes,
        memo: l.memo,
        status: l.status,
        createdAt: l.createdAt.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      }))}
    />
  );
}
