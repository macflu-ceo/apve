import Link from "next/link";
import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import { getCurrentPartner } from "@/lib/session";
import { getPartnerGrade } from "@/lib/grade";
import LoginPromptButton from "@/components/auth/LoginPromptButton";
import SettlementForm from "./SettlementForm";
import NicknameEditor from "./NicknameEditor";
import RewardSubmitBox from "./RewardSubmitBox";
import DeleteAccountButton from "./DeleteAccountButton";
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
  const isConcierge = partner.conciergeNo != null; // 컨시어지 자격(수수료 등급과 별개)
  const myGrade = isApproved ? await getPartnerGrade(partner.id) : null;
  const autoGrade = isApproved ? myGrade?.name ?? "어필리에이터" : "승인대기중";
  // 컨시어지면 분류를 '컨시어지'로 표시(첫구매 20% 커미션은 그대로 적용)
  const grade = isConcierge ? "컨시어지" : autoGrade;
  // 컨시어지이거나 커스텀 등급이면 가입 CTA 대신 현재 상태를 보여준다
  const isUpgraded = isConcierge || (isApproved && !!myGrade && myGrade.systemKey == null);

  const [links, sales, vouchers] = await Promise.all([
    prisma.issuedLink.findMany({ where: { partnerId: partner.id }, include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ where: { partnerId: partner.id }, orderBy: { orderedAt: "desc" } }),
    prisma.rewardVoucher.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const submissions = isApproved
    ? await prisma.rewardSubmission.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" }, take: 10 })
    : [];
  // 바우처에 적용된 상품명 매핑
  const vProductIds = [...new Set(vouchers.map((v) => v.productId).filter(Boolean) as string[])];
  const vProducts = vProductIds.length
    ? await prisma.product.findMany({ where: { id: { in: vProductIds } }, select: { id: true, name: true } })
    : [];
  const vProductName = new Map(vProducts.map((p) => [p.id, p.name]));
  const vAvail = vouchers.filter((v) => v.status === "available").length;
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
          {partner.settlementStatus === "verified" ? (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">✓ 정산 승인</span>
          ) : partner.settlementStatus === "submitted" ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">정산 승인 대기중</span>
          ) : null}
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

      {/* 정산정보 미등록 강조 — 등록해야 수수료 지급 가능 */}
      {isApproved && partner.settlementStatus === "none" && (
        <a href="#settlement" className="flex items-center justify-between rounded-xl2 border-2 border-amber-300 bg-amber-50 p-4">
          <div>
            <div className="text-sm font-black text-amber-800">⚠️ 정산정보를 등록해주세요</div>
            <div className="mt-0.5 text-xs text-amber-700">계좌 정보를 등록하고 관리자 승인을 받아야 수수료를 지급받을 수 있어요.</div>
          </div>
          <span className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white">등록하기 ↓</span>
        </a>
      )}

      {/* 커뮤니티 닉네임 (최초 1회 변경) */}
      <NicknameEditor nickname={partner.nickname} changed={partner.nicknameChanged} />

      {/* 컨시어지는 전용 센터로, 커스텀 등급은 현재 멤버십, 그 외는 가입 CTA */}
      {isConcierge ? (
        <Link href="/concierge" className="flex items-center justify-between rounded-xl2 bg-gradient-to-br from-[#2C3A30] to-[#222C25] p-5 text-white">
          <div>
            <div className="text-base font-black">컨시어지 센터</div>
            <div className="mt-0.5 text-xs font-semibold text-white/70">매장 링크·상품카드·전용 공지 바로가기</div>
          </div>
          <span className="text-xl">→</span>
        </Link>
      ) : isUpgraded ? (
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
          <div id="settlement"><SettlementForm status={partner.settlementStatus} minPayout={SETTLEMENT_POLICY.minPayout} /></div>

          {/* 리뷰·홍보 인증 → 20% 바우처 */}
          <RewardSubmitBox
            submissions={submissions.map((s) => ({
              id: s.id,
              type: s.type,
              status: s.status,
              createdAt: new Date(s.createdAt.getTime() + 9 * 3600_000).toISOString().slice(5, 10),
            }))}
          />

          {/* 20% 보상 바우처 (항상 표시) */}
          <section>
            <h2 className="mb-1 text-lg font-semibold">⭐ 내 20% 바우처</h2>
            <p className="mb-3 text-xs text-sub">
              인증 보상으로 받은 20% 바우처입니다. 원하는 상품 상세에서 <b>적용</b>하면 그 상품 <b>최초 판매 1건</b>에 20%가 적용돼요.
            </p>
            <div className="mb-2 rounded-xl2 bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
              사용 가능: <b className="text-amber-700">{vAvail}개</b>
              {vAvail > 0 ? (
                <span className="text-amber-700/80"> · 상품 상세페이지에서 적용하세요</span>
              ) : (
                <span className="text-amber-700/80"> · 위에서 리뷰·홍보 인증을 제출하면 받을 수 있어요</span>
              )}
            </div>
            {vouchers.length > 0 && (
              <ul className="space-y-1.5">
                {vouchers.map((v) => {
                  const label =
                    v.status === "available"
                      ? { t: "사용 가능", c: "bg-emerald-100 text-emerald-700" }
                      : v.status === "applied"
                        ? { t: "적용 중", c: "bg-amber-100 text-amber-700" }
                        : { t: "사용 완료", c: "bg-line text-sub" };
                  return (
                    <li key={v.id} className="card flex items-center justify-between gap-2 p-3 text-sm">
                      <div className="min-w-0">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${label.c}`}>{label.t}</span>
                        <span className="ml-2 text-xs text-sub">{v.reason}</span>
                        {v.productId && (
                          <div className="mt-0.5 truncate text-xs">
                            → {vProductName.get(v.productId) ?? "상품"}
                            {v.status === "used" && <span className="ml-1 font-bold text-amber-700">20% 적용됨</span>}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

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
                            {s.boost20 && (
                              <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700">20%</span>
                            )}
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

      {/* 회원 탈퇴 (모든 로그인 회원) */}
      <DeleteAccountButton />
    </div>
  );
}
