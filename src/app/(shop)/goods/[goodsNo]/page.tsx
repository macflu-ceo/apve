import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { won, parseList } from "@/lib/format";
import CodeButton from "./CodeButton";
import TryOnButton from "./TryOnButton";

export const dynamic = "force-dynamic";

export default async function GoodsPage({ params }: { params: { goodsNo: string } }) {
  const product = await prisma.product.findUnique({ where: { goodsNo: params.goodsNo } });
  if (!product) notFound();

  const images = parseList(product.imagesJson);
  const sizes = parseList(product.sizesJson);
  const expectedCommission =
    product.salePrice != null
      ? Math.round((product.salePrice * (product.commissionRate ?? 0)) / 100)
      : null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* 이미지 */}
      <div>
        <div className="card aspect-[3/4] overflow-hidden bg-black/5">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/30">No Image</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="aspect-square w-full rounded object-cover" />
            ))}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div>
        {product.brand && <div className="text-sm text-brand">{product.brand}</div>}
        <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{won(product.salePrice)}</span>
          {product.listPrice && product.salePrice && product.listPrice > product.salePrice && (
            <span className="text-sm text-ink/40 line-through">{won(product.listPrice)}</span>
          )}
        </div>

        {/* 예상 수익 */}
        <div className="card mt-4 flex items-center justify-between p-4">
          <span className="text-sm text-ink/70">예상 수익 (수수료 {product.commissionRate}%)</span>
          <span className="text-lg font-bold text-brand">{won(expectedCommission)}</span>
        </div>

        <dl className="mt-5 space-y-2 text-sm">
          {sizes.length > 0 && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink/50">사이즈</dt>
              <dd>{sizes.join(", ")}</dd>
            </div>
          )}
          {product.material && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink/50">소재</dt>
              <dd>{product.material}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="w-20 text-ink/50">재고</dt>
            <dd>{product.stock != null ? `${product.stock}개` : "-"}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 text-ink/50">상품번호</dt>
            <dd>{product.goodsNo}</dd>
          </div>
        </dl>

        {/* 내 코드 만들기 */}
        <CodeButton goodsNo={product.goodsNo} />

        {/* AI 착용샷 */}
        <TryOnButton goodsNo={product.goodsNo} />

        {product.sourceUrl && (
          <a href={product.sourceUrl} target="_blank" className="mt-3 block text-center text-xs text-ink/40 underline">
            원본 상품 페이지 보기
          </a>
        )}
      </div>
    </div>
  );
}
