// RSS 2.0 피드 — 최신 등록 상품 50개. 네이버 서치어드바이저 RSS 제출용.
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const site = (process.env.SITE_URL || "https://www.cashboutique.co.kr").replace(/\/$/, "");
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { goodsNo: true, name: true, brand: true, salePrice: true, imagesJson: true, createdAt: true },
  });

  const items = products
    .map((p) => {
      const url = `${site}/goods/${p.goodsNo}`;
      const img = parseList(p.imagesJson)[0];
      const desc = [p.brand, p.salePrice != null ? `${p.salePrice.toLocaleString()}원` : null]
        .filter(Boolean)
        .join(" · ");
      return `    <item>
      <title>${esc(p.name)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(desc)}</description>
      ${img ? `<enclosure url="${esc(img)}" type="image/jpeg" />` : ""}
      <pubDate>${p.createdAt.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>돈버는 명품샵</title>
    <link>${site}</link>
    <description>이탈리아 부티크 정품 명품을 코드 하나로 판매하는 어필리에이트 플랫폼 — 최신 등록 상품</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "s-maxage=3600" },
  });
}
