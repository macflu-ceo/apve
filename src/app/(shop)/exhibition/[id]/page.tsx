import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { getViewerRate } from "@/lib/grade";

export const dynamic = "force-dynamic";

export default async function ExhibitionPage({ params }: { params: { id: string } }) {
  const ex = await prisma.exhibition.findUnique({
    where: { id: params.id },
    include: { products: { orderBy: { sort: "asc" }, include: { product: true } } },
  });
  if (!ex || !ex.active) notFound();

  const products = ex.products.map((ep) => ep.product).filter((p) => p.active);
  const light = !!ex.bannerImageUrl;
  const rate = await getViewerRate();

  return (
    <div className="pb-10">
      {/* 상단 배너 */}
      <div
        className="relative flex aspect-[21/9] flex-col justify-end p-6 md:aspect-[3/1] md:p-10"
        style={
          ex.bannerImageUrl
            ? { backgroundImage: `url(${ex.bannerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundImage: `linear-gradient(135deg, ${ex.bannerFrom}, ${ex.bannerTo})` }
        }
      >
        {light && <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />}
        <h1 className={`relative text-2xl font-black md:text-4xl ${light ? "text-white" : "text-ink"}`}>{ex.title}</h1>
        {ex.subtitle && (
          <p className={`relative mt-1 text-sm font-semibold md:text-base ${light ? "text-white/85" : "text-ink/60"}`}>
            {ex.subtitle}
          </p>
        )}
      </div>

      {/* 상품 그리드 */}
      <div className="px-4 pt-6">
        {products.length === 0 ? (
          <div className="rounded-xl2 bg-[#f7f7f7] p-12 text-center text-sub">아직 담긴 상품이 없습니다.</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} percent={rate.percent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
