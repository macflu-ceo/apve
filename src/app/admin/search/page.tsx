import { prisma } from "@/lib/db";
import { ensureDefaultSearchCategories } from "@/lib/search";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminSearch() {
  await ensureDefaultSearchCategories();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [categories, top, recent30, total] = await Promise.all([
    prisma.searchCategory.findMany({ orderBy: [{ sort: "asc" }, { name: "asc" }] }),
    prisma.searchLog.groupBy({
      by: ["keyword"],
      _count: { keyword: true },
      orderBy: { _count: { keyword: "desc" } },
      take: 30,
    }),
    prisma.searchLog.count({ where: { createdAt: { gte: since } } }),
    prisma.searchLog.count(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-2xl font-bold">검색 설정 / 통계</h1>
        <p className="text-sm text-sub">
          검색창 자동완성은 <b>등록된 상품의 브랜드</b> + 아래 <b>카테고리</b>를 조합해 만들어져요. (예: &ldquo;구찌 가방&rdquo;)
        </p>
      </div>

      {/* 카테고리 관리 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">검색 카테고리 ({categories.length})</h2>
        <div className="card p-5">
          <CategoryManager categories={categories} />
        </div>
      </section>

      {/* 검색어 통계 */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">인기 검색어</h2>
          <span className="text-xs text-sub">최근 30일 {recent30.toLocaleString()}건 · 전체 {total.toLocaleString()}건</span>
        </div>
        {top.length === 0 ? (
          <div className="card p-6 text-sm text-sub">아직 검색 기록이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr>
                  <th className="w-16 py-2">순위</th>
                  <th>검색어</th>
                  <th className="w-28 text-right">검색수</th>
                </tr>
              </thead>
              <tbody>
                {top.map((t, i) => (
                  <tr key={t.keyword} className="border-b border-line">
                    <td className="py-2 text-sub">{i + 1}</td>
                    <td className="font-medium">{t.keyword}</td>
                    <td className="text-right font-bold text-brand">{t._count.keyword.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
