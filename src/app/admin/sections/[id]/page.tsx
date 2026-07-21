import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import SectionEditor from "./SectionEditor";

export const dynamic = "force-dynamic";

export default async function SectionDetail({ params }: { params: { id: string } }) {
  const [section, products] = await Promise.all([
    prisma.section.findUnique({
      where: { id: params.id },
      include: { products: { orderBy: { sort: "asc" } } },
    }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  if (!section) notFound();

  const selectedIds = section.products.map((sp) => sp.productId);

  return (
    <div>
      <Link href="/admin/sections" className="text-xs text-sub underline">
        ← 섹션 목록
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">섹션 · 상품 배치</h1>
      <SectionEditor
        section={{ id: section.id, title: section.title, subtitle: section.subtitle, sort: section.sort }}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          image: parseList(p.imagesJson)[0] ?? null,
          salePrice: p.salePrice,
          goodsNo: p.goodsNo,
          stock: p.stock,
          createdAt: p.createdAt.toISOString(),
        }))}
        selectedIds={selectedIds}
      />
    </div>
  );
}
