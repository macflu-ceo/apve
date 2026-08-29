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
    ml = await prisma.multiLink.create({
      data: {
        partnerId: partner.id,
        slug: (partner.code ?? partner.id.slice(-8)).toLowerCase(),
        displayName: partner.name,
      },
    });
  }

  const [items, links, leads, grade, sections] = await Promise.all([
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
  ]);

  const percent = grade?.percent ?? 0;
  const inPage = new Set(items.map((i) => i.productId));

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
        bio: ml.bio ?? "",
        avatarUrl: ml.avatarUrl ?? "",
        views: ml.views,
      }}
      percent={percent}
      sections={sections.map((s) => ({ id: s.id, title: s.title }))}
      items={items.map((i) => ({ id: i.id, sectionId: i.sectionId, ...toItem(i.product) }))}
      candidates={links.filter((l) => !inPage.has(l.productId) && l.product.active).map((l) => toItem(l.product))}
      leads={leads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        brands: l.brands,
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
