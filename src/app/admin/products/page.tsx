import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import ImportForm from "./ImportForm";
import BulkImportForm from "./BulkImportForm";
import ProductRow from "./ProductRow";
import RefreshStockButton from "./RefreshStockButton";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

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

      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">등록된 상품 ({products.length})</h2>
        <RefreshStockButton />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-line text-left text-sub">
            <tr>
              <th className="py-2">이미지</th>
              <th>상품</th>
              <th>정가</th>
              <th>할인율</th>
              <th>판매가</th>
              <th>원산지</th>
              <th>태그</th>
              <th>노출</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                p={{
                  id: p.id,
                  goodsNo: p.goodsNo,
                  name: p.name,
                  brand: p.brand,
                  listPrice: p.listPrice,
                  salePrice: p.salePrice,
                  origin: p.origin,
                  tags: parseList(p.tagsJson),
                  active: p.active,
                  image: parseList(p.imagesJson)[0] ?? null,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
