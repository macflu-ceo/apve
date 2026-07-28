import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { won, parseList } from "@/lib/format";
import { getViewerRate } from "@/lib/grade";
import { getSessionPartner } from "@/lib/auth";
import { logProductView } from "@/lib/analytics";
import { activeBoostForProduct } from "@/lib/timesale";
import SizeGuideModal from "@/components/SizeGuideModal";
import CodeButton from "./CodeButton";
import AiImageStudio from "./AiImageStudio";

export const dynamic = "force-dynamic";

/** 상품별 SEO 메타데이터 (제목/설명/OG 이미지/canonical) */
export async function generateMetadata({ params }: { params: { goodsNo: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { goodsNo: params.goodsNo } });
  if (!product) return { title: "상품을 찾을 수 없습니다" };

  const img = parseList(product.imagesJson)[0];
  const priceTxt = product.salePrice != null ? ` ${product.salePrice.toLocaleString()}원` : "";
  const parts = [product.brand, product.category, product.origin ? `${product.origin} 정품` : null].filter(Boolean);
  const desc =
    `${product.name}${priceTxt}. ${parts.join(" · ")}. 돈버는 명품샵에서 코드로 판매하고 수수료를 받으세요.`.slice(0, 155);
  const title = product.brand ? `${product.name}` : product.name;

  return {
    title,
    description: desc,
    alternates: { canonical: `/goods/${product.goodsNo}` },
    openGraph: {
      type: "website",
      title: `${title} | 돈버는 명품샵`,
      description: desc,
      url: `/goods/${product.goodsNo}`,
      ...(img ? { images: [{ url: img }] } : {}),
    },
    twitter: {
      card: img ? "summary_large_image" : "summary",
      title: `${title} | 돈버는 명품샵`,
      description: desc,
      ...(img ? { images: [img] } : {}),
    },
  };
}

export default async function GoodsPage({ params }: { params: { goodsNo: string } }) {
  const product = await prisma.product.findUnique({ where: { goodsNo: params.goodsNo } });
  if (!product) notFound();

  // 조회수 기록 (비차단)
  const viewer = await getSessionPartner();
  await logProductView(product.id, viewer?.id);

  const images = parseList(product.imagesJson);
  const sizes = parseList(product.sizesJson);
  // 사이즈별 재고 {"L":3,"M":2}
  const sizeStock: Record<string, number> = (() => {
    try {
      const v = JSON.parse(product.sizeStockJson ?? "{}");
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  })();
  const tags = parseList(product.tagsJson);
  const rate = await getViewerRate();
  const expectedCommission =
    product.salePrice != null ? Math.round((product.salePrice * rate.percent) / 100) : null;
  // 진행중 골든타임 부스트
  const boost = await activeBoostForProduct(product.id);
  const boostedCommission =
    boost > 0 && product.salePrice != null
      ? Math.round((product.salePrice * (rate.percent + boost)) / 100)
      : null;

  // 구조화 데이터 (Google 리치 결과용 Product 스키마)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.origin ? { countryOfOrigin: product.origin } : {}),
    ...(product.salePrice != null
      ? {
          offers: {
            "@type": "Offer",
            price: product.salePrice,
            priceCurrency: "KRW",
            availability:
              (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <div className="grid gap-8 px-4 pb-12 pt-8 md:grid-cols-2 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* 이미지 (대표 1장만) */}
      <div>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 bg-[#f5f4f2]">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sub">No Image</div>
          )}
          {tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
              {tags.map((t, i) => (
                <span key={i} className="rounded-[4px] bg-ink/85 px-2 py-1 text-xs font-bold text-white">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 정보 */}
      <div>
        {product.brand && <div className="text-sm font-bold text-brand">{product.brand}</div>}
        <h1 className="mt-1 text-2xl font-bold leading-snug">{product.name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-extrabold">{won(product.salePrice)}</span>
          {product.listPrice && product.salePrice && product.listPrice > product.salePrice && (
            <span className="text-sm text-sub line-through">{won(product.listPrice)}</span>
          )}
        </div>

        {/* 예상 수익 (등급별) */}
        {boostedCommission != null ? (
          <div className="mt-4 flex items-center justify-between rounded-xl2 bg-red-50 p-4 ring-1 ring-red-200">
            <span className="text-sm text-ink/70">
              예상 수익
              <span className="ml-1 inline-flex items-center gap-1 align-middle text-xs font-bold text-red-600">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 20V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {rate.isMine ? "" : "최대 "}수수료 {rate.percent + boost}%
                <span className="rounded bg-red-600 px-1 py-0.5 text-[10px] font-black text-white">+{boost}%p</span>
              </span>
            </span>
            <span className="text-right">
              <span className="mr-1 text-xs text-sub line-through">{won(expectedCommission)}</span>
              <span className="text-lg font-extrabold text-red-600">{won(boostedCommission)}</span>
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between rounded-xl2 bg-brandsoft p-4">
            <span className="text-sm text-ink/70">
              예상 수익
              <span className="ml-1 text-xs text-sub">
                ({rate.isMine ? `${rate.gradeName} ${rate.percent}%` : `최대 ${rate.percent}%`})
              </span>
            </span>
            <span className="text-lg font-extrabold text-brand">{won(expectedCommission)}</span>
          </div>
        )}

        {/* 상품 정보 */}
        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-sub">브랜드</dt>
            <dd>{product.brand ?? "-"}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-sub">원산지</dt>
            <dd>{product.origin ?? "-"}</dd>
          </div>
          {product.category && (
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-sub">카테고리</dt>
              <dd>{product.category}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-sub">사이즈</dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              {sizes.length === 0 && <span>-</span>}
              {sizes.map((s) => {
                const n = sizeStock[s] ?? 0;
                return (
                  <span
                    key={s}
                    title={n > 0 ? `재고 ${n}개` : "품절"}
                    className={`rounded-[4px] border px-2 py-1 text-xs font-bold ${
                      n > 0
                        ? "border-line text-ink"
                        : "border-line/60 text-sub line-through decoration-sub/60"
                    }`}
                  >
                    {s}
                    {n > 0 && <span className="ml-1 font-semibold text-brand">{n}</span>}
                  </span>
                );
              })}
              <SizeGuideModal category={product.category} productName={product.name} />
            </dd>
          </div>
          {product.material && (
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-sub">소재</dt>
              <dd>{product.material}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-sub">재고</dt>
            <dd>{product.stock != null ? `${product.stock}개` : "-"}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-sub">상품번호</dt>
            <dd>{product.goodsNo}</dd>
          </div>
        </dl>

        {/* 내 코드 만들기 */}
        <CodeButton goodsNo={product.goodsNo} />

        {/* AI 이미지 생성 */}
        <AiImageStudio goodsNo={product.goodsNo} />

        {product.sourceUrl && (
          <a href={product.sourceUrl} target="_blank" className="mt-3 block text-center text-xs text-sub underline">
            원본 상품 페이지 보기
          </a>
        )}
      </div>
    </div>
  );
}
