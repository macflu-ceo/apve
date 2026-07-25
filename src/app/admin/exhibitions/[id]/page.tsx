import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { getTopGradePercent } from "@/lib/grade";
import ExhibitionEditor from "./ExhibitionEditor";
import CopyLinkButton from "@/components/CopyLinkButton";

export const dynamic = "force-dynamic";

export default async function ExhibitionDetail({ params }: { params: { id: string } }) {
  const [ex, products, refPercent] = await Promise.all([
    prisma.exhibition.findUnique({
      where: { id: params.id },
      include: { products: { orderBy: { sort: "asc" } } },
    }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    getTopGradePercent(),
  ]);
  if (!ex) notFound();

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <Link href="/admin/exhibitions" className="text-xs text-sub underline">
          ← 기획전 목록
        </Link>
        <Link href={`/exhibition/${ex.id}`} target="_blank" className="text-xs text-brand underline">
          미리보기 ↗
        </Link>
      </div>
      <h1 className="mb-3 text-2xl font-bold">기획전 편집</h1>

      {/* 기획전 링크 */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl2 bg-brandsoft p-4">
        <span className="text-xs font-semibold text-sub">기획전 링크</span>
        <code className="rounded bg-white px-2 py-1 text-xs">/exhibition/{ex.id}</code>
        <CopyLinkButton path={`/exhibition/${ex.id}`} label="링크 복사" className="btn-brand px-3 py-1.5 text-xs" />
        <span className="text-xs text-sub">이 링크를 배너 클릭 링크·공유 등에 사용하세요.</span>
      </div>

      <ExhibitionEditor
        exhibition={{
          id: ex.id,
          title: ex.title,
          subtitle: ex.subtitle,
          bannerImageUrl: ex.bannerImageUrl,
          bannerFrom: ex.bannerFrom,
          bannerTo: ex.bannerTo,
          sort: ex.sort,
        }}
        refPercent={refPercent}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          season: p.season,
          image: parseList(p.imagesJson)[0] ?? null,
          listPrice: p.listPrice,
          salePrice: p.salePrice,
          goodsNo: p.goodsNo,
          stock: p.stock,
          createdAt: p.createdAt.toISOString(),
        }))}
        selectedIds={ex.products.map((ep) => ep.productId)}
      />
    </div>
  );
}
