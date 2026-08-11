import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import { couponState } from "@/lib/coupon";

export const dynamic = "force-dynamic";

const num = (v: unknown) => (typeof v === "bigint" ? Number(v) : Number(v ?? 0));

export default async function ConciergeCouponsAdmin() {
  const [total, used, reservations, visited, cpCount, wsCount, revenueAgg, perConcierge, recent] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { status: "used" } }),
    prisma.couponReservation.count(),
    prisma.couponReservation.count({ where: { status: "visited" } }),
    prisma.coupon.count({ where: { priceType: "cp" } }),
    prisma.coupon.count({ where: { priceType: "ws" } }),
    prisma.coupon.aggregate({ where: { status: "used" }, _sum: { purchaseAmount: true } }),
    prisma.coupon.groupBy({ by: ["conciergeId", "conciergeName"], _count: { _all: true } }),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { store: true } }),
  ]);

  // 컨시어지별 사용(전환) 수
  const usedByConcierge = await prisma.coupon.groupBy({ by: ["conciergeId"], where: { status: "used" }, _count: { _all: true } });
  const usedMap = new Map(usedByConcierge.map((u) => [u.conciergeId, u._count._all]));
  const ranking = perConcierge
    .map((p) => ({ name: p.conciergeName, issued: p._count._all, used: usedMap.get(p.conciergeId) ?? 0 }))
    .sort((a, b) => b.used - a.used || b.issued - a.issued);

  const revenue = num(revenueAgg._sum.purchaseAmount);
  const stat = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : "-");

  const STATE: Record<string, { t: string; c: string }> = {
    valid: { t: "사용가능", c: "text-emerald-600" },
    used: { t: "사용완료", c: "text-brand" },
    expired: { t: "만료", c: "text-red-500" },
    canceled: { t: "취소", c: "text-sub" },
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">쿠폰 · 집계</h1>
      <p className="mb-5 text-sm text-sub">매장 특별 이용 권한 발급·예약·방문·사용 집계입니다.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="발급" value={`${total}건`} />
        <Stat label="예약" value={`${reservations}건`} sub={`예약률 ${stat(reservations, total)}`} />
        <Stat label="방문" value={`${visited}건`} sub={`방문률 ${stat(visited, total)}`} />
        <Stat label="사용(구매전환)" value={`${used}건`} sub={`전환율 ${stat(used, total)}`} highlight />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="cp (마진 있음)" value={`${cpCount}건`} />
        <Stat label="ws (마진 없음)" value={`${wsCount}건`} />
        <Stat label="집계 매출(입력분)" value={won(revenue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 컨시어지 순위 */}
        <div>
          <h2 className="mb-2 text-base font-bold">컨시어지 순위</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr><th className="px-4 py-2">컨시어지</th><th className="px-4 py-2 text-right">발급</th><th className="px-4 py-2 text-right">사용</th><th className="px-4 py-2 text-right">전환</th></tr>
              </thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sub">데이터 없음</td></tr>
                ) : ranking.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-2 font-semibold">{i + 1}. {r.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.issued}</td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums text-brand">{r.used}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{stat(r.used, r.issued)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 최근 발급 */}
        <div>
          <h2 className="mb-2 text-base font-bold">최근 발급 ({recent.length})</h2>
          <div className="card max-h-[420px] overflow-y-auto">
            <ul className="divide-y divide-line text-sm">
              {recent.map((c) => {
                const st = couponState(c);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{c.customerName} <span className="text-xs text-sub">{c.conciergeName}</span></div>
                      <div className="text-[11px] text-sub"><code>{c.code}</code> · {c.store.name}</div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${STATE[st].c}`}>{STATE[st].t}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "ring-1 ring-brand/30" : ""}`}>
      <div className="text-xs text-sub">{label}</div>
      <div className={`mt-1 text-xl font-bold ${highlight ? "text-brand" : ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-sub">{sub}</div>}
    </div>
  );
}
