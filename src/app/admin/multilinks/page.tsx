import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 컨시어지 멀티링크 페이지 전체 목록 */
export default async function MultiLinksAdmin() {
  const links = await prisma.multiLink.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      partner: { select: { name: true, username: true, conciergeNo: true } },
      _count: { select: { items: true, sections: true, banners: true, leads: true } },
    },
  });

  const totalLeads = links.reduce((s, l) => s + l._count.leads, 0);
  const totalViews = links.reduce((s, l) => s + l.views, 0);

  return (
    <div>
      <h1 className="text-xl font-bold">멀티링크 페이지</h1>
      <p className="mt-1 text-sm text-sub">
        컨시어지들이 만든 개인 샵 페이지 전체입니다. 총 {links.length}개 · 누적 조회 {totalViews.toLocaleString()}회 · 취향등록 {totalLeads}건
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-[#f7f6f4] text-left text-xs text-sub">
            <tr>
              <th className="px-3 py-2.5">컨시어지</th>
              <th className="px-3 py-2.5">페이지 이름</th>
              <th className="px-3 py-2.5">주소</th>
              <th className="px-3 py-2.5 text-right">상품</th>
              <th className="px-3 py-2.5 text-right">섹션</th>
              <th className="px-3 py-2.5 text-right">배너</th>
              <th className="px-3 py-2.5 text-right">조회</th>
              <th className="px-3 py-2.5 text-right">취향등록</th>
              <th className="px-3 py-2.5">생성일</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-10 text-center text-sub">아직 만들어진 멀티링크가 없습니다.</td></tr>
            )}
            {links.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="whitespace-nowrap px-3 py-2.5">
                  <b>{l.partner.name}</b>
                  <span className="ml-1 text-xs text-sub">@{l.partner.username}</span>
                  {l.partner.conciergeNo != null && <span className="ml-1 text-xs text-sub">#{l.partner.conciergeNo}</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {l.avatarUrl && <img src={l.avatarUrl} className="mr-1.5 inline-block h-6 w-6 rounded-full object-cover align-middle" alt="" />}
                  {l.displayName}의 명품샵
                  {!l.active && <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">비활성</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <a href={`https://veca.sh/${l.slug}`} target="_blank" className="font-bold text-brand hover:underline">
                    veca.sh/{l.slug} ↗
                  </a>
                </td>
                <td className="px-3 py-2.5 text-right">{l._count.items}</td>
                <td className="px-3 py-2.5 text-right">{l._count.sections}</td>
                <td className="px-3 py-2.5 text-right">{l._count.banners}</td>
                <td className="px-3 py-2.5 text-right font-bold">{l.views.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right">
                  {l._count.leads > 0
                    ? <span className="rounded-full bg-brandsoft px-2 py-0.5 font-bold text-brand">{l._count.leads}</span>
                    : <span className="text-sub">0</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-sub">
                  {l.createdAt.toLocaleDateString("ko-KR", { year: "2-digit", month: "numeric", day: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-sub">주소를 클릭하면 실제 고객 페이지가 새 탭으로 열립니다. 취향등록 상세는 &lsquo;멀티링크 추천신청&rsquo; 메뉴에서 확인하세요.</p>
    </div>
  );
}
