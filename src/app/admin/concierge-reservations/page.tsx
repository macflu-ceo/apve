import { prisma } from "@/lib/db";
import StatusButtons from "./StatusButtons";

export const dynamic = "force-dynamic";

const BADGE: Record<string, string> = {
  reserved: "bg-amber-100 text-amber-700",
  visited: "bg-emerald-100 text-emerald-700",
  noshow: "bg-red-50 text-red-500",
  canceled: "bg-line text-sub",
};

export default async function ConciergeReservationsPage() {
  const rows = await prisma.couponReservation.findMany({
    orderBy: [{ date: "desc" }, { time: "asc" }],
    take: 100,
    include: { coupon: { include: { store: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">방문 예약</h1>
      <p className="mb-5 text-sm text-sub">고객이 특별 이용 권한 화면에서 신청한 방문 예약입니다.</p>

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-sub">예약이 없습니다.</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-sub">
              <tr>
                <th className="px-4 py-3">일시</th>
                <th className="px-4 py-3">고객</th>
                <th className="px-4 py-3">컨시어지 · 코드</th>
                <th className="px-4 py-3">매장</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">변경</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{r.date} <span className="text-sub">{r.time}</span></td>
                  <td className="px-4 py-3">{r.coupon.customerName}<div className="text-[11px] text-sub">****{r.coupon.customerPhone.slice(-4)}</div></td>
                  <td className="px-4 py-3 text-sub">{r.coupon.conciergeName}<div className="text-[11px]"><code>{r.coupon.code}</code></div></td>
                  <td className="px-4 py-3 text-sub">{r.coupon.store.name}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${BADGE[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3"><StatusButtons id={r.id} current={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
