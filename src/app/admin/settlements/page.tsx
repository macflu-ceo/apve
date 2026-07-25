import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import { SETTLEMENT_POLICY as P } from "@/lib/terms";
import { PayButton, RevertButton } from "./PayButton";

export const dynamic = "force-dynamic";

function net(gross: number) {
  return gross - Math.round((gross * P.withholdingRate) / 100);
}
function fmt(d: Date | null) {
  if (!d) return "-";
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

export default async function AdminSettlements() {
  // 미정산: 구매확정 + 미지급 + 파트너 매칭됨
  const unpaid = await prisma.sale.findMany({
    where: { status: "confirmed", paidOut: false, partnerId: { not: null } },
    include: { partner: { select: { id: true, name: true, username: true, code: true, settlementStatus: true } } },
    orderBy: { orderedAt: "asc" },
  });

  // 파트너별 집계
  const groups = new Map<
    string,
    { partner: NonNullable<(typeof unpaid)[number]["partner"]>; count: number; gross: number }
  >();
  for (const s of unpaid) {
    if (!s.partner) continue;
    const g = groups.get(s.partner.id) ?? { partner: s.partner, count: 0, gross: 0 };
    g.count += 1;
    g.gross += s.commission;
    groups.set(s.partner.id, g);
  }
  const rows = [...groups.values()].sort((a, b) => b.gross - a.gross);
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);

  // 지급 완료 이력 (배치: 파트너 + paidOutAt)
  const paid = await prisma.sale.findMany({
    where: { paidOut: true },
    include: { partner: { select: { name: true, username: true } } },
    orderBy: { paidOutAt: "desc" },
    take: 500,
  });
  const batches = new Map<string, { name: string; username: string; at: Date; count: number; gross: number }>();
  for (const s of paid) {
    if (!s.paidOutAt) continue;
    const key = `${s.partnerId}|${s.paidOutAt.toISOString()}`;
    const b = batches.get(key) ?? {
      name: s.partner?.name ?? "-",
      username: s.partner?.username ?? "-",
      at: s.paidOutAt,
      count: 0,
      gross: 0,
    };
    b.count += 1;
    b.gross += s.commission;
    batches.set(key, b);
  }
  const history = [...batches.entries()].map(([key, v]) => ({ key, partnerId: key.split("|")[0], ...v }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">정산</h1>
      <p className="mb-4 text-sm text-sub">
        <b>구매확정</b>된 미지급 수수료입니다. 원천징수 {P.withholdingRate}%(소득세 3% + 지방세 0.3%) 차감 후 실지급액 기준.
        <br />
        정산 주기: {P.closingDesc} 마감 · 익월 {P.payDay}일 지급 · 최소 지급액 {P.minPayout.toLocaleString()}원 · 대상: {P.confirmDesc}
      </p>

      {/* 요약 */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs text-sub">미정산 파트너</div>
          <div className="mt-2 text-xl font-bold">{rows.length}명</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-sub">미정산 수수료(세전 합계)</div>
          <div className="mt-2 text-xl font-bold text-brand">{won(totalGross)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-sub">실지급 예상(원천징수 후)</div>
          <div className="mt-2 text-xl font-bold">{won(net(totalGross))}</div>
        </div>
      </div>

      {/* 미정산 목록 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">미정산 목록</h2>
        {rows.length === 0 ? (
          <div className="card p-6 text-sm text-sub">정산할 확정 수수료가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr>
                  <th className="py-2">파트너</th>
                  <th>코드</th>
                  <th>정산정보</th>
                  <th className="text-right">확정 건수</th>
                  <th className="text-right">수수료(세전)</th>
                  <th className="text-right">원천징수 {P.withholdingRate}%</th>
                  <th className="text-right">실지급액</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const wh = Math.round((r.gross * P.withholdingRate) / 100);
                  const n = r.gross - wh;
                  const below = r.gross < P.minPayout;
                  const noInfo = r.partner.settlementStatus === "none";
                  return (
                    <tr key={r.partner.id} className="border-b border-line align-middle">
                      <td className="py-2 font-medium">{r.partner.name}</td>
                      <td><code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{r.partner.code}</code></td>
                      <td>
                        {noInfo ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">미등록</span>
                        ) : (
                          <span className="rounded-full bg-deal/15 px-2 py-0.5 text-xs font-bold text-deal">등록됨</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">{r.count}건</td>
                      <td className="text-right font-semibold tabular-nums text-brand">{won(r.gross)}</td>
                      <td className="text-right tabular-nums text-sub">-{won(wh)}</td>
                      <td className="text-right font-bold tabular-nums">
                        {won(n)}
                        {below && <div className="text-[10px] font-normal text-amber-600">최소지급액 미달</div>}
                      </td>
                      <td className="text-right">
                        <PayButton partnerId={r.partner.id} net={n} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-sub">
          ※ 실제 계좌이체는 별도로 진행하고, 이체 후 <b>지급 완료 처리</b>를 눌러 기록하세요. (되돌리기 가능)
        </p>
      </section>

      {/* 지급 이력 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">지급 완료 이력</h2>
        {history.length === 0 ? (
          <div className="card p-6 text-sm text-sub">지급 이력이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr>
                  <th className="py-2">지급일</th>
                  <th>파트너</th>
                  <th className="text-right">건수</th>
                  <th className="text-right">수수료(세전)</th>
                  <th className="text-right">실지급액</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.key} className="border-b border-line">
                    <td className="py-2">{fmt(h.at)}</td>
                    <td>{h.name} <span className="text-xs text-sub">@{h.username}</span></td>
                    <td className="text-right tabular-nums">{h.count}건</td>
                    <td className="text-right tabular-nums">{won(h.gross)}</td>
                    <td className="text-right font-semibold tabular-nums">{won(net(h.gross))}</td>
                    <td className="text-right">
                      <RevertButton partnerId={h.partnerId} paidOutAt={h.at.toISOString()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
