import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { getTopGradePercent } from "@/lib/grade";
import { getTimeSaleConfig, resolveState } from "@/lib/timesale";
import TimeSaleEditor from "./TimeSaleEditor";

export const dynamic = "force-dynamic";

export default async function AdminTimeSale() {
  const [config, products, items, refPercent] = await Promise.all([
    getTimeSaleConfig(),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.timeSaleProduct.findMany({ where: { timeSaleId: "main" }, orderBy: { sort: "asc" } }),
    getTopGradePercent(),
  ]);

  const state = resolveState(config, items.length);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">타임세일</h1>
      <p className="mb-6 text-sm text-sub">
        맨 위 배너에 노출됩니다. 상품·할인율·오픈 시간을 정하고, 진행 중일 때 추가 할인가와 카운트다운이 표시됩니다.
      </p>

      <TimeSaleEditor
        config={{
          title: config.title,
          upcomingText: config.upcomingText,
          liveText: config.liveText,
          baseDiscount: config.baseDiscount,
          active: config.active,
          startAt: config.startAt?.toISOString() ?? null,
          endAt: config.endAt?.toISOString() ?? null,
        }}
        state={state}
        refPercent={refPercent}
        initialItems={items.map((i) => ({ productId: i.productId, discount: i.discount }))}
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
      />
    </div>
  );
}
