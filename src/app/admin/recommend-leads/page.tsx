import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 멀티링크 '추천받기' 신청 DB — 전체 모아보기 (담당 컨시어지 표시) */
export default async function RecommendLeadsAdmin() {
  const leads = await prisma.recommendLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { multiLink: { include: { partner: { select: { name: true, username: true, conciergeNo: true } } } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">멀티링크 추천 신청</h1>
      <p className="mt-1 text-sm text-sub">
        컨시어지 멀티링크의 &lsquo;추천받기&rsquo;로 들어온 고객 DB입니다. 응대는 담당 컨시어지가 하며, 여기서는 전체 현황을 봅니다.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[#f7f6f4] text-left text-xs text-sub">
            <tr>
              <th className="px-3 py-2.5">신청일</th>
              <th className="px-3 py-2.5">고객</th>
              <th className="px-3 py-2.5">연락처</th>
              <th className="px-3 py-2.5">취향 정보</th>
              <th className="px-3 py-2.5">요청사항</th>
              <th className="px-3 py-2.5">담당 컨시어지</th>
              <th className="px-3 py-2.5">상태</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-sub">아직 신청이 없습니다.</td></tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-sub">
                  {l.createdAt.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-3 py-2.5 font-bold">{l.name}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{l.phone}</td>
                <td className="px-3 py-2.5">
                  <div className="flex max-w-[280px] flex-wrap gap-1">
                    {[l.brands, l.ageRange, l.gender, l.budget, l.sizes && `사이즈 ${l.sizes}`]
                      .filter(Boolean)
                      .map((v, i) => (
                        <span key={i} className="rounded-full bg-brandsoft px-2 py-0.5 text-[11px]">{v}</span>
                      ))}
                  </div>
                </td>
                <td className="max-w-[220px] px-3 py-2.5 text-xs text-sub">{l.memo ?? "-"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <b>{l.multiLink.partner.name}</b>
                  <span className="ml-1 text-xs text-sub">@{l.multiLink.partner.username}</span>
                  {l.multiLink.partner.conciergeNo != null && (
                    <span className="ml-1 text-xs text-sub">#{l.multiLink.partner.conciergeNo}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {l.status === "new"
                    ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">대기</span>
                    : <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">완료</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
