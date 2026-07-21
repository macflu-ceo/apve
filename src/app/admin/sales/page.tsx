import { prisma } from "@/lib/db";
import { won } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSales() {
  const sales = await prisma.sale.findMany({
    include: { product: true, partner: true },
    orderBy: { orderedAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">판매내역</h1>
      <p className="mb-6 text-sm text-ink/60">
        고도몰이 기록한 유입 코드 기준으로 파트너에 귀속된 판매 데이터입니다.
        <br />
        <span className="text-ink/40">
          ※ 연동 통로(고도몰 API/제휴마케팅) 확정 전까지는 시드/수동 업로드로 채워집니다.
        </span>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-black/10 text-left text-ink/50">
            <tr>
              <th className="py-2">일자</th>
              <th>상품</th>
              <th>코드</th>
              <th>파트너</th>
              <th>금액</th>
              <th>수수료</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-black/5">
                <td className="py-2">{s.orderedAt.toISOString().slice(0, 10)}</td>
                <td className="max-w-[220px] truncate">{s.product.name}</td>
                <td>
                  <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">{s.code}</code>
                </td>
                <td>{s.partner?.name ?? <span className="text-red-500">미매칭</span>}</td>
                <td>{won(s.amount)}</td>
                <td className="font-semibold text-brand">{won(s.commission)}</td>
                <td className="text-ink/60">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
