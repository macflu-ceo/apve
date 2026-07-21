import Link from "next/link";
import { prisma } from "@/lib/db";
import { won } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, partners, sales, salesAgg] = await Promise.all([
    prisma.product.count(),
    prisma.partner.count(),
    prisma.sale.count(),
    prisma.sale.aggregate({ _sum: { amount: true, commission: true } }),
  ]);

  const cards = [
    { label: "등록 상품", value: `${products}개`, href: "/admin/products" },
    { label: "파트너", value: `${partners}명`, href: "/admin/partners" },
    { label: "총 판매 건수", value: `${sales}건`, href: "/admin/sales" },
    { label: "총 매출", value: won(salesAgg._sum.amount ?? 0), href: "/admin/sales" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 hover:shadow-md">
            <div className="text-xs text-ink/50">{c.label}</div>
            <div className="mt-2 text-xl font-bold">{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
