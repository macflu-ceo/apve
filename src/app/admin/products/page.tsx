import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import ImportForm from "./ImportForm";
import BulkImportForm from "./BulkImportForm";
import ProductTable from "./ProductTable";
import RefreshStockButton from "./RefreshStockButton";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  // 가격 최신화가 조용히 멈춰도 화면상으론 멀쩡해 보인다.
  // 마지막 확인 시각을 모아 보여줘야 멈춘 걸 알아챌 수 있다.
  const DAY = 86400000;
  const nowMs = Date.now();
  const live = products.filter((p) => p.active);
  const age = (d: Date | null) => (d ? nowMs - d.getTime() : Infinity);
  const fresh = live.filter((p) => age(p.pricedAt) <= 2 * DAY).length;
  const stale = live.filter((p) => age(p.pricedAt) > 2 * DAY && p.pricedAt != null).length;
  const never = live.filter((p) => p.pricedAt == null).length;
  const last = live.reduce<Date | null>((a, p) => (p.pricedAt && (!a || p.pricedAt > a) ? p.pricedAt : a), null);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">상품 등록 / 관리</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-1 text-sm font-bold">URL로 등록 (스크래핑)</div>
          <p className="mb-3 text-xs text-sub">고도몰 상품 URL 하나를 넣어 정보를 자동 수집합니다.</p>
          <ImportForm />
        </div>
        <BulkImportForm />
      </div>

      {/* 가격 최신화 상태 */}
      <div className="mt-8 rounded-xl border border-line p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-bold">가격·재고 최신화 상태</div>
          <div className="text-xs text-sub">
            마지막 확인{" "}
            {last ? last.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "기록 없음"}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-brandsoft px-2 py-1 font-bold text-brand">2일 이내 {fresh}</span>
          {stale > 0 && (
            <span className="rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700 ring-1 ring-amber-200">
              2일 지남 {stale}
            </span>
          )}
          {never > 0 && (
            <span className="rounded-md bg-red-50 px-2 py-1 font-bold text-red-600 ring-1 ring-red-200">
              확인 이력 없음 {never}
            </span>
          )}
        </div>
        {(stale > 0 || never > 0) && (
          <p className="mt-2 text-[11px] leading-relaxed text-sub">
            매일 05시 자동 갱신(GitHub Actions · 홈 자동 갱신)이 도는지 확인하세요. 카탈로그 API가 요청을 몰아
            받으면 <b>unauthorized</b> 로 막혀 일부 브랜드가 통째로 빠질 수 있고, 그때는 텔레그램 알림에 실패
            브랜드가 함께 옵니다.
          </p>
        )}
      </div>

      <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">등록된 상품 ({products.length})</h2>
        <RefreshStockButton />
      </div>
      <ProductTable
        products={products.map((p) => ({
          id: p.id,
          goodsNo: p.goodsNo,
          name: p.name,
          brand: p.brand,
          category: p.category,
          listPrice: p.listPrice,
          salePrice: p.salePrice,
          origin: p.origin,
          tags: parseList(p.tagsJson),
          active: p.active,
          image: parseList(p.imagesJson)[0] ?? null,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
