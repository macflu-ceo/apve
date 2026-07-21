import { prisma } from "@/lib/db";
import ExhibitionForm from "./ExhibitionForm";
import ExhibitionRow from "./ExhibitionRow";

export const dynamic = "force-dynamic";

export default async function AdminExhibitions() {
  const list = await prisma.exhibition.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">기획전 관리</h1>
      <p className="mb-5 text-sm text-sub">
        이름과 상단 배너를 정하고, 등록된 전체 상품에서 골라 담아 <b>독립 기획전 페이지</b>를 만듭니다. 배너 클릭 링크로도 연결할 수 있어요.
      </p>

      <div className="card mb-8 p-5">
        <ExhibitionForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">기획전 ({list.length})</h2>
      {list.length === 0 ? (
        <div className="card p-6 text-sm text-sub">등록된 기획전이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {list.map((e) => (
            <ExhibitionRow
              key={e.id}
              e={{
                id: e.id,
                title: e.title,
                subtitle: e.subtitle,
                bannerImageUrl: e.bannerImageUrl,
                bannerFrom: e.bannerFrom,
                bannerTo: e.bannerTo,
                active: e.active,
                count: e._count.products,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
