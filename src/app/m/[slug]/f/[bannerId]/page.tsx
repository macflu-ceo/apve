import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { partnerLink } from "@/lib/godomall/link";
import { ProductCard, type ShopItem } from "../../ShopBody";

export const dynamic = "force-dynamic";

function firstImage(imagesJson: string | null): string | null {
  try {
    const arr = JSON.parse(imagesJson ?? "[]");
    return Array.isArray(arr) && arr[0] ? String(arr[0]) : null;
  } catch {
    return null;
  }
}
const discount = (list: number | null, sale: number | null) =>
  list && sale && list > sale ? Math.round((1 - sale / list) * 100) : null;

async function getData(slug: string, bannerId: string) {
  const banner = await prisma.multiLinkBanner.findUnique({
    where: { id: bannerId },
    include: {
      multiLink: { include: { partner: { select: { code: true } } } },
      section: { include: { items: { orderBy: [{ sort: "asc" }, { createdAt: "asc" }], include: { product: true } } } },
    },
  });
  if (!banner || banner.multiLink.slug !== slug || !banner.multiLink.active) return null;
  return banner;
}

export async function generateMetadata({ params }: { params: { slug: string; bannerId: string } }): Promise<Metadata> {
  const b = await getData(params.slug, params.bannerId);
  if (!b) return { title: { absolute: "VIA ÉLITE" } };
  return {
    title: { absolute: `${b.title ?? b.section?.title ?? "기획전"} | ${b.multiLink.displayName}의 명품샵` },
    openGraph: { images: [b.imageUrl] },
  };
}

export default async function BannerCollectionPage({ params }: { params: { slug: string; bannerId: string } }) {
  const banner = await getData(params.slug, params.bannerId);
  if (!banner) notFound();

  const code = banner.multiLink.partner.code ?? "";
  const items: ShopItem[] = (banner.section?.items ?? [])
    .filter((i) => i.product.active)
    .map((i) => ({
      id: i.id,
      url: partnerLink(i.product.goodsNo, code),
      name: i.product.name.replace(/^\[[^\]]*\]\s*/, ""),
      brand: i.product.brand,
      category: i.product.category,
      image: firstImage(i.product.imagesJson),
      salePrice: i.product.salePrice,
      listPrice: i.product.listPrice,
      discount: discount(i.product.listPrice, i.product.salePrice),
      sectionKey: "f",
    }));

  return (
    <div className="min-h-dvh bg-[#F3F5FB]">
      <div className="mx-auto min-h-dvh max-w-[430px] bg-[#F3F5FB] pb-16">
        {/* 상단 바 */}
        <div className="sticky top-0 z-40 flex items-center gap-2 bg-white/90 px-3 py-3 backdrop-blur">
          <Link href={`/m/${params.slug}`} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-600">←</Link>
          <span className="text-[15px] font-extrabold text-gray-900">{banner.multiLink.displayName}의 명품샵</span>
        </div>

        {/* 배너 히어로 */}
        <div className="relative">
          <img src={banner.imageUrl} alt={banner.title ?? ""} className="max-h-[300px] w-full object-cover" />
          {(banner.title || banner.section?.title) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-4 pt-12">
              <h1 className="text-[20px] font-extrabold text-white">{banner.title ?? banner.section?.title}</h1>
              <div className="mt-0.5 text-[12px] text-white/80">{items.length}개 상품 · 100% 정품 보증</div>
            </div>
          )}
        </div>

        {/* 상품 그리드 */}
        <div className="mt-4 px-4">
          {items.length === 0 ? (
            <div className="mt-14 text-center text-sm text-gray-400">아직 담긴 상품이 없어요.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 px-4 text-center">
          <Link href={`/m/${params.slug}`} className="inline-block rounded-full bg-white px-6 py-2.5 text-[13px] font-bold text-gray-700 ring-1 ring-gray-200">
            전체 상품 보러가기
          </Link>
          <p className="mt-6 text-[11px] text-gray-400">VIA ÉLITE · 이탈리아 부티크 직계약</p>
        </div>
      </div>
    </div>
  );
}
