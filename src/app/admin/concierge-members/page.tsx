import { prisma } from "@/lib/db";
import { conciergeCode } from "@/lib/concierge-access";
import { AppointForm, RevokeButton } from "./AppointForm";

export const dynamic = "force-dynamic";

export default async function ConciergeMembersPage() {
  const concierges = await prisma.partner.findMany({
    where: { conciergeNo: { not: null } },
    orderBy: { conciergeNo: "asc" },
    select: { id: true, name: true, username: true, phone: true, conciergeNo: true },
  });
  // 발급 쿠폰 수 집계
  const counts = await prisma.coupon.groupBy({ by: ["conciergeId"], _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.conciergeId, c._count._all]));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">컨시어지 임명</h1>
      <p className="mb-5 text-sm text-sub">
        회원을 컨시어지로 임명하면 <b>매장 링크 생성기·상품카드 생성기·전용 공지</b>에 접근할 수 있고, 컨시어지 번호(코드)가 부여됩니다.
      </p>

      <div className="card mb-6 p-5">
        <AppointForm />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-left text-sub">
            <tr>
              <th className="px-4 py-3">번호</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">아이디</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3 text-right">발급 쿠폰</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {concierges.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sub">아직 임명된 컨시어지가 없습니다.</td>
              </tr>
            ) : (
              concierges.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{conciergeCode(c.conciergeNo!)}</code>
                  </td>
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-sub">@{c.username}</td>
                  <td className="px-4 py-3 text-sub">{c.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{(countMap.get(c.id) ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <RevokeButton partnerId={c.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
