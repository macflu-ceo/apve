import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import ProductFilterBar from "@/components/ProductFilterBar";
import { getViewerRate } from "@/lib/grade";
import { parseFilter, buildWhere, sortProducts, getFacets } from "@/lib/productFilter";
import { getActiveBoostMap } from "@/lib/timesale";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filter = parseFilter(searchParams);
  const where = buildWhere(filter, { activeOnly: true });

  const [rows, facets, rate, boostMap] = await Promise.all([
    prisma.product.findMany({ where }),
    getFacets(true),
    getViewerRate(),
    getActiveBoostMap(),
  ]);
  const products = sortProducts(rows, filter.sort);

  return (
    <div className="px-4 py-4">
      <h1 className="mb-2 text-xl font-black">상품 전체</h1>

      <ProductFilterBar facets={facets} />

      <p className="mb-4 text-sm text-sub">{products.length.toLocaleString()}개의 상품</p>

      {products.length === 0 ? (
        <div className="rounded-xl2 bg-[#f7f7f7] p-12 text-center text-sub">
          조건에 맞는 상품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} percent={rate.percent} boost={boostMap.get(p.goodsNo) ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
