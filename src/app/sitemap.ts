import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/category`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/timesale`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE_URL}/board`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/concierge`, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const [products, exhibitions, posts] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, select: { goodsNo: true, updatedAt: true } }),
      prisma.exhibition.findMany({ where: { active: true }, select: { id: true } }),
      prisma.post.findMany({ where: { published: true }, select: { id: true, updatedAt: true } }),
    ]);
    return [
      ...base,
      ...products.map((p) => ({ url: `${SITE_URL}/goods/${p.goodsNo}`, lastModified: p.updatedAt, priority: 0.8 })),
      ...exhibitions.map((e) => ({ url: `${SITE_URL}/exhibition/${e.id}`, priority: 0.7 })),
      ...posts.map((p) => ({ url: `${SITE_URL}/board/${p.id}`, lastModified: p.updatedAt, priority: 0.5 })),
    ];
  } catch {
    return base;
  }
}
