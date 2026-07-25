import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import SyncForm from "./SyncForm";

export const dynamic = "force-dynamic";

function fmt(d: Date | null) {
  if (!d) return "-";
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "구매확정", cls: "bg-deal/15 text-deal" },
  pending: { label: "진행중", cls: "bg-amber-100 text-amber-700" },
  canceled: { label: "취소/반품", cls: "bg-red-100 text-red-600" },
};

export default async function AdminSales() {
  const sales = await prisma.sale.findMany({
    include: { partner: true },
    orderBy: { orderedAt: "desc" },
    take: 1000,
  });

  const valid = sales.filter((s) => s.status !== "canceled");
  const totalAmount = valid.reduce((s, x) => s + x.amount, 0);
  const totalCommission = valid.reduce((s, x) => s + x.commission, 0);
  const confirmedCommission = sales
    .filter((s) => s.status === "confirmed")
    .reduce((s, x) => s + x.commission, 0);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">판매내역</h1>
      <p className="mb-6 text-sm text-ink/60">
        고도몰 유입 코드(salesAgentCode) 기준으로 파트너에 귀속된 판매 데이터입니다.
      </p>

      <SyncForm />

      {/* 요약 */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-sub">유효 주문</div>
          <div className="mt-1 text-lg font-bold">{valid.length.toLocaleString()}건</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-sub">유효 매출</div>
          <div className="mt-1 text-lg font-bold">{won(totalAmount)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-sub">예상 수수료(전체)</div>
          <div className="mt-1 text-lg font-bold text-brand">{won(totalCommission)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-sub">확정 수수료(정산대상)</div>
          <div className="mt-1 text-lg font-bold text-brand">{won(confirmedCommission)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="border-b border-line text-left text-sub">
            <tr>
              <th className="py-2">주문일</th>
              <th>주문번호</th>
              <th>상품</th>
              <th>옵션</th>
              <th>코드</th>
              <th>파트너</th>
              <th className="text-right">금액</th>
              <th className="text-right">수수료</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sub">
                  판매내역이 없습니다. 위에서 <b>고도몰에서 가져오기</b>를 실행하세요.
                </td>
              </tr>
            )}
            {sales.map((s) => {
              const st = STATUS_LABEL[s.status] ?? { label: s.status, cls: "bg-line text-sub" };
              return (
                <tr key={s.id} className="border-b border-line align-middle">
                  <td className="whitespace-nowrap py-2">{fmt(s.orderedAt)}</td>
                  <td className="whitespace-nowrap text-xs text-sub">{s.orderNo ?? "-"}</td>
                  <td className="max-w-[240px] truncate">{s.goodsName ?? s.goodsNo ?? "-"}</td>
                  <td className="whitespace-nowrap text-xs text-sub">{s.optionName ?? "-"}</td>
                  <td>
                    <code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{s.code}</code>
                  </td>
                  <td className="whitespace-nowrap">
                    {s.partner?.name ?? <span className="text-red-500">미매칭</span>}
                  </td>
                  <td className="whitespace-nowrap text-right tabular-nums">{won(s.amount)}</td>
                  <td className="whitespace-nowrap text-right font-semibold tabular-nums text-brand">
                    {s.status === "canceled" ? "-" : won(s.commission)}
                  </td>
                  <td>
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
