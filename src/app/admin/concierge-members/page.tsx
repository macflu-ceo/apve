import { prisma } from "@/lib/db";
import { conciergeCode } from "@/lib/concierge-access";
import { AppointForm, RevokeButton } from "./AppointForm";
import ExtendButton from "./ExtendButton";
import { conciergeTerm, TERM_TARGET } from "@/lib/concierge-term";

export const dynamic = "force-dynamic";

export default async function ConciergeMembersPage() {
  const concierges = await prisma.partner.findMany({
    where: { conciergeNo: { not: null } },
    orderBy: { conciergeNo: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      conciergeNo: true,
      conciergeStartedAt: true,
    },
  });
  // 발급 쿠폰 수 집계
  const counts = await prisma.coupon.groupBy({ by: ["conciergeId"], _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.conciergeId, c._count._all]));

  // 이번 구간 성적 — 남은 기간이 짧은 사람이 위로 오게 세운다
  const terms = new Map(
    await Promise.all(
      concierges.map(async (c) => [c.id, await conciergeTerm(c.id, c.conciergeStartedAt)] as const),
    ),
  );
  const soon = concierges
    .filter((c) => {
      const t = terms.get(c.id)!;
      return t.daysLeft != null && t.daysLeft <= 30;
    })
    .sort((a, b) => (terms.get(a.id)!.daysLeft ?? 0) - (terms.get(b.id)!.daysLeft ?? 0));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">컨시어지 임명</h1>
      <p className="mb-5 text-sm text-sub">
        회원을 컨시어지로 임명하면 <b>매장 링크 생성기·상품카드 생성기·전용 공지</b>에 접근할 수 있고, 컨시어지 번호(코드)가 부여됩니다.
      </p>

      <div className="card mb-6 p-5">
        <AppointForm />
      </div>

      {/* 기한이 코앞인 사람 — 목록을 다 훑기 전에 먼저 눈에 걸려야 한다 */}
      {soon.length > 0 && (
        <div className="card mb-6 border-2 border-amber-400/60 bg-amber-50 p-5">
          <div className="text-base font-bold text-amber-900">
            기한 30일 이내 {soon.length}명
          </div>
          <p className="mt-1 text-xs text-amber-900/70">
            3개월 안에 매출 {(TERM_TARGET / 10000).toLocaleString()}만원을 못 채우면 자격이 풀립니다.
          </p>
          <div className="mt-3 space-y-2">
            {soon.map((c) => {
              const t = terms.get(c.id)!;
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/70 px-3 py-2 text-sm"
                >
                  <b>{c.name}</b>
                  <span className="text-sub">@{c.username}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      (t.daysLeft ?? 0) <= 7 ? "text-red-600" : "text-amber-700"
                    }`}
                  >
                    {t.daysLeft}일 남음
                  </span>
                  <span className="tabular-nums text-sub">
                    {(t.sales / 10000).toLocaleString()}만원 · {t.rate}%
                  </span>
                  <span className="ml-auto">
                    <ExtendButton id={c.id} name={c.name} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-left text-sub">
            <tr>
              <th className="px-4 py-3">번호</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">아이디</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3 text-right">남은 기간</th>
              <th className="px-4 py-3 text-right">구간 매출</th>
              <th className="px-4 py-3 text-right">달성률</th>
              <th className="px-4 py-3 text-right">발급 쿠폰</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {concierges.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sub">아직 임명된 컨시어지가 없습니다.</td>
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
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(() => {
                      const t = terms.get(c.id)!;
                      if (t.daysLeft == null) return <span className="text-sub">-</span>;
                      if (t.expired) return <span className="font-bold text-red-600">기한 초과</span>;
                      return (
                        <span className={(t.daysLeft ?? 0) <= 30 ? "font-bold text-amber-700" : ""}>
                          {t.daysLeft}일
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(terms.get(c.id)!.sales / 10000).toLocaleString()}만
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(() => {
                      const r = terms.get(c.id)!.rate;
                      return (
                        <span className={r >= 100 ? "font-bold text-deal" : r >= 50 ? "" : "text-sub"}>
                          {r}%
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{(countMap.get(c.id) ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-2">
                      <ExtendButton id={c.id} name={c.name} />
                      <RevokeButton partnerId={c.id} />
                    </span>
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
