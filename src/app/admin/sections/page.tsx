import { prisma } from "@/lib/db";
import SectionForm from "./SectionForm";
import SectionRow from "./SectionRow";

export const dynamic = "force-dynamic";

export default async function AdminSections() {
  const sections = await prisma.section.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">홈 진열(섹션)</h1>
      <p className="mb-5 text-sm text-sub">
        홈에 <b>섹션 제목 + 상품 묶음</b>을 위에서 아래로 쌓습니다. 섹션을 만들고 ‘상품 배치’로 진열할 상품을 고르세요.
        (섹션이 없으면 홈은 전체 상품을 기본 노출)
      </p>

      <div className="card mb-8 p-5">
        <SectionForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">섹션 ({sections.length})</h2>
      {sections.length === 0 ? (
        <div className="card p-6 text-sm text-sub">등록된 섹션이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {sections.map((s) => (
            <SectionRow
              key={s.id}
              s={{ id: s.id, title: s.title, subtitle: s.subtitle, sort: s.sort, active: s.active, count: s._count.products }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
