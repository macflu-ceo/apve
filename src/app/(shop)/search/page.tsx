import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { getViewerRate } from "@/lib/grade";
import { logSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();

  if (!q) {
    return (
      <div className="px-4 py-10 text-center text-sub">
        검색어를 입력해 주세요. <span className="text-xs">(예: 구찌 가방)</span>
      </div>
    );
  }

  // 검색어 통계 기록
  await logSearch(q);

  // 토큰별 AND 조건 (브랜드/카테고리/상품명 어디든 포함)
  const tokens = q.split(/\s+/).filter(Boolean);
  const products = await prisma.product.findMany({
    where: {
      active: true,
      AND: tokens.map((t) => ({
        OR: [
          { name: { contains: t, mode: "insensitive" as const } },
          { brand: { contains: t, mode: "insensitive" as const } },
          { category: { contains: t, mode: "insensitive" as const } },
        ],
      })),
    },
    orderBy: { createdAt: "desc" },
  });

  const rate = await getViewerRate();

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-black">
        &lsquo;{q}&rsquo; 검색 결과
      </h1>
      <p className="mb-5 mt-1 text-sm text-sub">{products.length}개의 상품</p>

      {products.length === 0 ? (
        <div className="rounded-xl2 bg-[#f7f7f7] p-12 text-center text-sub">
          검색 결과가 없습니다.
          <br />
          <Link href="/" className="mt-2 inline-block text-xs text-brand underline">
            전체 상품 보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} percent={rate.percent} />
          ))}
        </div>
      )}
    </div>
  );
}
