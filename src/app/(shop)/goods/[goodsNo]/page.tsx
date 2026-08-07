import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { won, parseList } from "@/lib/format";
import { getSiteSetting } from "@/lib/settings";
import { getViewerRate } from "@/lib/grade";
import AppUpsellButton from "@/components/AppUpsellButton";
import { getSessionPartner } from "@/lib/auth";
import { activeBoostForProduct } from "@/lib/timesale";
import SizeGuideModal from "@/components/SizeGuideModal";
import ProductGallery from "@/components/ProductGallery";
import { keepProductImages } from "@/lib/godomall/scrape";
import { sizeSystem, sizeSystemLabel, displaySize, isOneSizeOnly } from "@/lib/sizeSystem";
import { voucherCounts } from "@/lib/voucher";
import CodeButton from "./CodeButton";
import AiImageStudio from "./AiImageStudio";
import VoucherApplyButton from "./VoucherApplyButton";

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

  // 상품 조회는 클라이언트 <Tracker>가 Visit(kind=product)로 기록한다(봇 필터 적용).
  // 서버 렌더마다 무조건 기록하던 방식(logProductView)은 봇 오염으로 폐기.
  const viewer = await getSessionPartner();

  // 20% 바우처 상태 (승인 회원만)
  let voucher: { available: number; appliedHere: "applied" | "used" | null } | null = null;
  if (viewer?.status === "approved") {
    const [counts, here] = await Promise.all([
      voucherCounts(viewer.id),
      prisma.rewardVoucher.findFirst({
        where: { partnerId: viewer.id, productId: product.id, status: { in: ["applied", "used"] } },
        select: { status: true },
      }),
    ]);
    voucher = { available: counts.available, appliedHere: (here?.status as "applied" | "used" | undefined) ?? null };
  }

  const images = parseList(product.imagesJson);
  const galleryImages = keepProductImages(images); // 공통 배너·깨진 링크 제외 (기존 상품도 즉시 적용)
  const sizes = parseList(product.sizesJson);
  const sizeSys = sizeSystem(product.brand); // IT | FR | null (브랜드 본국 기준)
  const oneSize = isOneSizeOnly(sizes); // 단일(프리) 사이즈만인지
  const domestic = parseList(product.tagsJson).includes("국내배송"); // 국내배송 여부
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
  // 웹에서만: 앱 전용 첫판매 프리미엄 유도 (앱 요율 기준 수수료 + 추가 이득)
  const setting = await getSiteSetting();
  const appCommission =
    product.salePrice != null ? Math.round((product.salePrice * rate.appPercent) / 100) : null;
  const showAppUpsell =
    rate.platform === "web" &&
    rate.appPremium > 0 &&
    appCommission != null &&
    expectedCommission != null &&
    appCommission > expectedCommission;
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
    ...(galleryImages.length ? { image: galleryImages } : {}),
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
      {/* 이미지 (스와이프 갤러리 + 썸네일 — 공통 배너 제외) */}
      <div>
        <ProductGallery images={galleryImages} alt={product.name} tags={tags} />
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

        {/* 앱 전용 수수료 유도 (웹에서만) */}
        {showAppUpsell && (
          <AppUpsellButton
            ios={setting.appIosUrl}
            android={setting.appAndroidUrl}
            landing={setting.appLandingUrl}
            appAmountLabel={won(appCommission)}
            gapLabel={`+${won(appCommission! - expectedCommission!)}`}
          />
        )}

        {/* 배송 안내 */}
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl2 p-3 text-sm ${
            domestic ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-[#f4f1ea] text-ink/80"
          }`}
        >
          {domestic ? (
            <>
              <span className="text-base">🇰🇷</span>
              <span><b>국내배송</b> · 결제 후 <b>2~3일 이내</b> 도착</span>
            </>
          ) : (
            <>
              <span className="text-base">✈️</span>
              <span>
                {product.origin ? `${product.origin} ` : ""}<b>해외배송</b> · 통관 포함 <b>약 2주</b> 소요
              </span>
            </>
          )}
        </div>

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
                    {displaySize(s)}
                    {n > 0 && <span className="ml-1 font-semibold text-brand">{n}</span>}
                  </span>
                );
              })}
              {sizeSys && !oneSize && (
                <span className="ml-0.5 rounded bg-brandsoft px-1.5 py-0.5 text-[11px] font-bold text-brand">
                  {sizeSystemLabel(sizeSys)} 기준
                </span>
              )}
              <SizeGuideModal
                category={product.category}
                productName={product.name}
                brand={product.brand}
                sizes={sizes}
                system={sizeSys}
              />
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

        {/* 20% 보상 바우처 적용 */}
        {voucher && (
          <VoucherApplyButton
            goodsNo={product.goodsNo}
            available={voucher.available}
            appliedHere={voucher.appliedHere}
          />
        )}

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
