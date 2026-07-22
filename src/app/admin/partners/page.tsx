import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import { listGrades } from "@/lib/grade";
import PendingRow from "./PendingRow";
import GradeSelect from "./GradeSelect";

export const dynamic = "force-dynamic";

export default async function AdminPartners() {
  const [partners, grades] = await Promise.all([
    prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { sales: true, links: true } }, sales: true },
    }),
    listGrades(),
  ]);
  const gradeOptions = grades.map((g) => ({ id: g.id, name: g.name, percent: g.percent }));
  const firstName = grades.find((g) => g.systemKey === "first")?.name ?? "첫구매";
  const normalName = grades.find((g) => g.systemKey === "normal")?.name ?? "일반";

  const pending = partners.filter((p) => p.status === "pending");
  const approved = partners.filter((p) => p.status === "approved");
  const rejected = partners.filter((p) => p.status === "rejected");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">회원(파트너) 관리</h1>

      {/* 가입 신청 대기 */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">
          가입 신청 대기 <span className="text-brand">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <div className="card p-6 text-sm text-sub">대기 중인 신청이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <PendingRow
                key={p.id}
                p={{ id: p.id, username: p.username, name: p.name, phone: p.phone, verified: p.verified, createdAt: p.createdAt.toISOString().slice(0, 10) }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 승인된 파트너 */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">승인된 파트너 ({approved.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-sub">
              <tr>
                <th className="py-2">이름</th>
                <th>아이디</th>
                <th>코드</th>
                <th>등급</th>
                <th>링크</th>
                <th>판매</th>
                <th>누적 수수료</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((p) => {
                const commission = p.sales.reduce((s, x) => s + x.commission, 0);
                return (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="text-sub">@{p.username}</td>
                    <td>
                      <code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{p.code}</code>
                    </td>
                    <td>
                      <GradeSelect
                        partnerId={p.id}
                        gradeId={p.gradeId}
                        autoName={p._count.sales > 0 ? normalName : firstName}
                        grades={gradeOptions}
                      />
                    </td>
                    <td>{p._count.links}건</td>
                    <td>{p._count.sales}건</td>
                    <td className="font-semibold text-brand">{won(commission)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {rejected.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-sub">반려 ({rejected.length})</h2>
          <div className="text-sm text-sub">
            {rejected.map((p) => (
              <span key={p.id} className="mr-3">
                {p.name}(@{p.username})
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
