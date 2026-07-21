import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CategoryPage() {
  const products = await prisma.product.findMany({ where: { active: true } });
  // MVP: 브랜드 기준 그룹핑 (추후 고도몰 카테고리 연동)
  const byBrand = new Map<string, number>();
  for (const p of products) {
    const b = p.brand ?? "기타";
    byBrand.set(b, (byBrand.get(b) ?? 0) + 1);
  }
  const brands = [...byBrand.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">카테고리</h1>
      {brands.length === 0 ? (
        <div className="card p-10 text-center text-ink/60">등록된 상품이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {brands.map(([brand, count]) => (
            <Link key={brand} href="/" className="card p-6 text-center hover:shadow-md">
              <div className="font-semibold">{brand}</div>
              <div className="mt-1 text-xs text-ink/50">{count}개 상품</div>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-ink/40">
        ※ 현재는 브랜드 기준 그룹핑입니다. 고도몰 카테고리 체계 연동 시 확장됩니다.
      </p>
    </div>
  );
}
