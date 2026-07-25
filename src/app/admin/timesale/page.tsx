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
      <h1 className="mb-1 text-2xl font-bold">골든타임 (한정 수수료 부스트)</h1>
      <p className="mb-6 text-sm text-sub">
        맨 위 배너에 노출됩니다. 한정 시간 동안 선택한 상품을 팔면 <b>수수료가 올라갑니다.</b> 상품·부스트·오픈 시간을 정하세요.
        <br />
        (상품 가격은 그대로이고, 파트너가 받는 수수료율만 올라가는 방식이라 고도몰 설정이 필요 없습니다.)
      </p>

      <TimeSaleEditor
        config={{
          title: config.title,
          upcomingText: config.upcomingText,
          liveText: config.liveText,
          baseBoost: config.baseBoost,
          active: config.active,
          startAt: config.startAt?.toISOString() ?? null,
          endAt: config.endAt?.toISOString() ?? null,
        }}
        state={state}
        refPercent={refPercent}
        initialItems={items.map((i) => ({ productId: i.productId, boost: i.boost }))}
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
