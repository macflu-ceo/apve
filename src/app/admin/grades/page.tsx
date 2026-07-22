import { prisma } from "@/lib/db";
import { ensureDefaultGrades } from "@/lib/grade";
import GradeManager from "./GradeManager";

export const dynamic = "force-dynamic";

export default async function AdminGrades() {
  await ensureDefaultGrades();
  const grades = await prisma.grade.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { partners: true } } },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">회원 등급 / 수수료율</h1>
      <p className="mb-5 text-sm text-sub">
        수수료율은 <b>상품이 아니라 회원 등급</b>에 귀속됩니다. 여기서 정한 %가 상품 목록·상세의 예상수익과 정산에 그대로 적용돼요.
      </p>
      <GradeManager
        grades={grades.map((g) => ({
          id: g.id,
          name: g.name,
          percent: g.percent,
          sort: g.sort,
          systemKey: g.systemKey,
          count: g._count.partners,
        }))}
      />
    </div>
  );
}
