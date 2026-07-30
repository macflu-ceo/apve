import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import ExpandableGrid from "@/components/ExpandableGrid";
import BannerCarousel from "@/components/BannerCarousel";
import { getSiteSetting } from "@/lib/settings";
import { getViewerRate } from "@/lib/grade";
import { getActiveBoostMap } from "@/lib/timesale";

export const dynamic = "force-dynamic";

// DB에 배너/카테고리/섹션이 없을 때의 기본값
const DEFAULT_BANNERS = [
  { title: "이탈리아 부티크 직수입", subtitle: "정가 대비 최대 70% 특가", imageUrl: null, bgFrom: "#e9dfd5", bgTo: "#cdb7a6", linkUrl: null },
  { title: "이번 주 신상 명품", subtitle: "새로 들어온 럭셔리 셀렉션", imageUrl: null, bgFrom: "#e5e7ec", bgTo: "#c3c8d2", linkUrl: null },
  { title: "내 코드로 시작하는 판매", subtitle: "컨시어지 어필리에이트", imageUrl: null, bgFrom: "#efe6df", bgTo: "#d8c3b3", linkUrl: null },
];

const DEFAULT_CHIPS = ["전체", "가방", "의류", "슈즈", "아우터", "니트", "지갑", "액세서리", "신상", "특가"].map(
  (label) => ({ label, emoji: null as string | null, imageUrl: null as string | null, linkUrl: "/category" })
);

export default async function HomePage() {
  const [allProducts, dbBanners, dbCategories, dbSections, setting] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.banner.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] }),
    prisma.section.findMany({
      where: { active: true },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
      include: { products: { orderBy: { sort: "asc" }, include: { product: true } } },
    }),
    getSiteSetting(),
  ]);
  const rate = await getViewerRate();
  const boostMap = await getActiveBoostMap();

  const banners = dbBanners.length > 0 ? dbBanners : DEFAULT_BANNERS;
  const categories = dbCategories.length > 0 ? dbCategories : DEFAULT_CHIPS;

  // 섹션이 있으면 섹션대로, 없으면 전체 상품을 기본 섹션으로
  const sections =
    dbSections.length > 0
      ? dbSections.map((s) => ({
          title: s.title,
          subtitle: s.subtitle,
          products: s.products.map((sp) => sp.product).filter((p) => p.active),
        }))
      : [{ title: "관심 가질 만한 상품", subtitle: "엄선한 명품 셀렉션이에요", products: allProducts }];

  return (
    <div className="pb-8">
      {/* 히어로 배너 (자동 슬라이드 캐러셀) */}
      <section className="pt-4">
        <BannerCarousel banners={banners} interval={setting.bannerInterval} />
      </section>

      {/* 카테고리 칩 (어드민 커스텀) */}
      <section className="px-4 py-6">
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {categories.map((c, i) => (
            <Link key={i} href={c.linkUrl || "/category"} className="flex shrink-0 flex-col items-center gap-1.5">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brandsoft text-lg font-black text-brand">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  c.emoji || c.label[0]
                )}
              </span>
              <span className="text-xs text-ink/70">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 섹션들 (타이틀 + 상품, 아래로 쭉) */}
      {sections.map((sec, i) => (
        <section key={i} className="px-4 pb-10">
          <div className="mb-1 text-xl font-black">{sec.title}</div>
          {sec.subtitle && <p className="mb-4 text-sm text-sub">{sec.subtitle}</p>}

          {sec.products.length === 0 ? (
            <div className="rounded-xl2 bg-[#f7f7f7] p-10 text-center text-sm text-sub">진열된 상품이 없습니다.</div>
          ) : (
            <ExpandableGrid limit={15}>
              {sec.products.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  percent={rate.percent}
                  boost={boostMap.get(p.goodsNo) ?? 0}
                  confirmed={rate.isMine}
                  rank={i === 0 && idx < 3 ? idx + 1 : undefined}
                />
              ))}
            </ExpandableGrid>
          )}
        </section>
      ))}

      {allProducts.length === 0 && (
        <div className="mx-4 rounded-xl2 bg-[#f7f7f7] p-12 text-center text-sub">
          아직 등록된 상품이 없습니다.{" "}
          <Link href="/admin/products" className="font-bold text-brand underline">
            어드민에서 상품 등록
          </Link>
        </div>
      )}
    </div>
  );
}
