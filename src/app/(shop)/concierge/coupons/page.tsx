import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getConciergeViewer } from "@/lib/concierge-access";
import { couponState, dday } from "@/lib/coupon";
import IssueForm from "./IssueForm";

export const dynamic = "force-dynamic";

const STATE_BADGE: Record<string, { t: string; c: string }> = {
  valid: { t: "사용가능", c: "bg-emerald-100 text-emerald-700" },
  used: { t: "사용완료", c: "bg-line text-sub" },
  expired: { t: "만료", c: "bg-red-50 text-red-500" },
  canceled: { t: "취소", c: "bg-line text-sub" },
};

export default async function ConciergeCouponsPage() {
  const c = await getConciergeViewer();
  if (!c) redirect("/concierge");

  const [stores, coupons] = await Promise.all([
    prisma.store.findMany({ where: { active: true }, orderBy: { sort: "asc" }, select: { id: true, name: true } }),
    prisma.coupon.findMany({
      where: { conciergeId: c.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { reservation: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/concierge" className="text-sm text-sub hover:text-ink">← 컨시어지 홈</Link>
      <h1 className="mt-2 text-2xl font-bold">매장 특별 이용 권한</h1>
      <p className="mb-5 mt-1 text-sm text-sub">고객 정보를 입력해 발급하고, 생성된 링크를 카톡으로 보내세요.</p>

      <div className="card mb-6 p-5">
        <h2 className="mb-3 text-base font-bold">새 발급</h2>
        <IssueForm stores={stores} />
      </div>

      <h2 className="mb-2 text-base font-bold">발급 내역 ({coupons.length})</h2>
      {coupons.length === 0 ? (
        <div className="card p-6 text-sm text-sub">아직 발급한 내역이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {coupons.map((cp) => {
            const st = couponState(cp);
            const b = STATE_BADGE[st];
            const d = dday(cp.endAt);
            return (
              <li key={cp.id}>
                <Link href={`/coupon/${cp.id}`} target="_blank" className="card flex items-center justify-between gap-3 p-3 hover:bg-brandsoft">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${b.c}`}>{b.t}</span>
                      <span className="truncate font-semibold">{cp.customerName}</span>
                      <span className="text-xs text-sub">{cp.priceType}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-sub">
                      <code>{cp.code}</code> · ~{cp.endAt.toISOString().slice(0, 10)}
                      {st === "valid" && d >= 0 && <span className="ml-1 text-brand">D-{d}</span>}
                      {cp.reservation && <span className="ml-1">· 예약 {cp.reservation.date} {cp.reservation.time}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-ink/30">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
