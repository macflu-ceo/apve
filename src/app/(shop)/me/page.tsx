import Link from "next/link";
import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import { getCurrentPartner } from "@/lib/session";
import { getPartnerGrade } from "@/lib/grade";
import LoginPromptButton from "@/components/auth/LoginPromptButton";
import SettlementForm from "./SettlementForm";
import { SETTLEMENT_POLICY } from "@/lib/terms";

export const dynamic = "force-dynamic";

const SALE_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "구매확정", cls: "text-deal" },
  pending: { label: "진행중", cls: "text-amber-600" },
  canceled: { label: "취소/반품", cls: "text-red-500" },
};

export default async function MyPage() {
  const partner = await getCurrentPartner();
  if (!partner) {
    return (
      <div className="mx-4 my-10 rounded-xl2 border border-line p-10 text-center text-ink/60">
        <div className="text-lg font-bold text-ink">로그인이 필요합니다</div>
        <p className="mt-1 text-sm">로그인 후 등급과 판매내역을 확인하세요.</p>
        <LoginPromptButton />
      </div>
    );
  }

  const isApproved = partner.status === "approved";
  const myGrade = isApproved ? await getPartnerGrade(partner.id) : null;
  const grade = isApproved ? myGrade?.name ?? "어필리에이터" : "승인대기중";
  // 첫구매/일반(시스템 등급)이 아닌 커스텀 등급 = 이미 업그레이드된 회원
  const isUpgraded = isApproved && !!myGrade && myGrade.systemKey == null;

  const [links, sales] = await Promise.all([
    prisma.issuedLink.findMany({ where: { partnerId: partner.id }, include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ where: { partnerId: partner.id }, orderBy: { orderedAt: "desc" } }),
  ]);
  // 매출·수익은 취소/반품 제외
  const validSales = sales.filter((s) => s.status !== "canceled");
  const totalAmount = validSales.reduce((s, x) => s + x.amount, 0);
  const totalCommission = validSales.reduce((s, x) => s + x.commission, 0);
  // 정산 대상(구매확정)만
  const confirmedCommission = sales
    .filter((s) => s.status === "confirmed")
    .reduce((s, x) => s + x.commission, 0);

  return (
    <div className="space-y-6 px-4 py-6">
      {/* 헤더 + 등급 */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">내정보</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              isApproved ? "bg-deal/15 text-deal" : "bg-amber-100 text-amber-700"
            }`}
          >
            {grade}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          {partner.name} 님
          {myGrade && (
            <>
              {" "}· 수수료율 <b className="text-brand">{myGrade.percent}%</b>
            </>
          )}
          {isApproved && partner.code && (
            <>
              {" "}· 내 코드 <code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{partner.code}</code>
            </>
          )}
        </p>
      </div>

      {/* 상위 등급(컨시어지 등)은 업그레이드 CTA 대신 현재 멤버십을 보여준다 */}
      {isUpgraded ? (
        <div className="flex items-center justify-between rounded-xl2 bg-gradient-to-br from-[#efe6df] to-[#d8c3b3] p-5">
          <div>
            <div className="text-base font-black text-ink">{myGrade!.name} 멤버십</div>
            <div className="mt-0.5 text-xs font-semibold text-ink/60">
              수수료율 {myGrade!.percent}% 가 적용되고 있습니다
            </div>
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-ink">이용중</span>
        </div>
      ) : (
        <Link
          href="/concierge"
          className="flex items-center justify-between rounded-xl2 bg-gradient-to-br from-[#efe6df] to-[#d8c3b3] p-5"
        >
          <div>
            <div className="text-base font-black text-ink">컨시어지 가입하기</div>
            <div className="mt-0.5 text-xs font-semibold text-ink/60">멤버십을 업그레이드하고 더 큰 혜택을 받으세요</div>
          </div>
          <span className="text-xl">→</span>
        </Link>
      )}

      {!isApproved ? (
        /* 승인대기중 안내 */
        <div className="rounded-xl2 border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <div className="font-bold">승인대기중입니다</div>
          <p className="mt-1">
            관리자 승인이 완료되면 <b>어필리에이터</b>로 활동할 수 있고, 판매용 코드가 발급됩니다.
          </p>
        </div>
      ) : (
        <>
          {/* 요약 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <div className="text-xs text-sub">판매 건수</div>
              <div className="mt-1 text-lg font-bold">{validSales.length}건</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-sub">판매 매출</div>
              <div className="mt-1 text-lg font-bold">{won(totalAmount)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-sub">예상 수익</div>
              <div className="mt-1 text-lg font-bold text-brand">{won(totalCommission)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-sub">확정 수익</div>
              <div className="mt-1 text-lg font-bold text-brand">{won(confirmedCommission)}</div>
              <div className="mt-0.5 text-[10px] text-sub">정산 대상</div>
            </div>
          </div>

          {/* 정산 정보 (2단계) */}
          <SettlementForm status={partner.settlementStatus} minPayout={SETTLEMENT_POLICY.minPayout} />

          {/* 판매내역 */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">판매내역</h2>
            {sales.length === 0 ? (
              <div className="card p-6 text-sm text-sub">아직 판매내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-line text-left text-sub">
                    <tr>
                      <th className="py-2">일자</th>
                      <th>상품</th>
                      <th>옵션</th>
                      <th className="text-right">금액</th>
                      <th className="text-right">수익</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => {
                      const st = SALE_STATUS[s.status] ?? { label: s.status, cls: "text-sub" };
                      return (
                        <tr key={s.id} className="border-b border-line align-middle">
                          <td className="whitespace-nowrap py-2">
                            {new Date(s.orderedAt.getTime() + 9 * 3600_000).toISOString().slice(0, 10)}
                          </td>
                          <td className="max-w-[220px] truncate">{s.goodsName ?? s.goodsNo ?? "-"}</td>
                          <td className="whitespace-nowrap text-xs text-sub">{s.optionName ?? "-"}</td>
                          <td className="whitespace-nowrap text-right tabular-nums">{won(s.amount)}</td>
                          <td className="whitespace-nowrap text-right font-semibold tabular-nums text-brand">
                            {s.status === "canceled" ? "-" : won(s.commission)}
                          </td>
                          <td className={`whitespace-nowrap text-xs font-bold ${st.cls}`}>{st.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 내 판매 링크 */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">내 판매 링크</h2>
            {links.length === 0 ? (
              <div className="card p-6 text-sm text-sub">
                상품 상세에서 <b>내 코드 만들기</b>로 링크를 발급하세요.
              </div>
            ) : (
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
                    <span className="truncate">{l.product.name}</span>
                    <a href={l.url} target="_blank" className="shrink-0 text-brand underline">
                      링크 열기
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
