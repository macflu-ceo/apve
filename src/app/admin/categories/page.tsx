import { prisma } from "@/lib/db";
import CategoryForm from "./CategoryForm";
import CategoryRow from "./CategoryRow";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const [categories, exhibitions] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] }),
    prisma.exhibition.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">카테고리 관리</h1>
      <p className="mb-5 text-sm text-sub">홈 메인 배너 아래 원형 카테고리 칩을 관리합니다. (없으면 기본 칩 노출)</p>

      <div className="card mb-8 p-5">
        <CategoryForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">등록된 카테고리 ({categories.length})</h2>
      {categories.length === 0 ? (
        <div className="card p-6 text-sm text-sub">등록된 카테고리가 없습니다.</div>
      ) : (
        <div className="grid gap-2">
          {categories.map((c) => (
            <CategoryRow key={c.id} c={c} exhibitions={exhibitions} />
          ))}
        </div>
      )}
    </div>
  );
}
