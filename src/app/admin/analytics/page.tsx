import Link from "next/link";
import { won } from "@/lib/format";
import { getFunnel, getTopProducts, getDailySeries, getRetentionSummary } from "@/lib/analytics";
import DateRange from "./DateRange";
import TrafficSection from "./TrafficSection";

export const dynamic = "force-dynamic";

function daysAgo(n: number) {
  const t = Date.now() + 9 * 3600_000 - n * 86400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export default async function AdminAnalytics({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const from = searchParams.from ?? daysAgo(29);
  const to = searchParams.to ?? daysAgo(0);

  const [funnel, top, series, retention] = await Promise.all([
    getFunnel(from, to),
    getTopProducts(from, to, 10),
    getDailySeries(from, to),
    getRetentionSummary(from, to),
  ]);

  // 전환율(코드생성/조회, 판매/코드생성)
  const viewToLink = funnel.productViews > 0 ? (funnel.linksCreated / funnel.productViews) * 100 : 0;
  const linkToSale = funnel.linksCreated > 0 ? (funnel.salesCount / funnel.linksCreated) * 100 : 0;

  const steps = [
    { label: "신규 가입", value: `${funnel.signups.toLocaleString()}명`, sub: "회원가입" },
    { label: "상품 조회", value: `${funnel.productViews.toLocaleString()}회`, sub: "상세페이지 진입" },
    { label: "내 코드 만들기", value: `${funnel.linksCreated.toLocaleString()}건`, sub: `조회→코드 ${viewToLink.toFixed(1)}%` },
    { label: "판매(확정)", value: `${funnel.salesCount.toLocaleString()}건`, sub: `코드→판매 ${linkToSale.toFixed(1)}%` },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">애널리틱스</h1>
      <p className="mb-6 text-sm text-sub">
        <b>방문 · 리텐션</b> → 활성화 퍼널(<b>가입 → 조회 → 코드 → 판매</b>) → 인기 상품. 일자별로 기록됩니다.
      </p>

      <DateRange from={from} to={to} />

      {/* 방문 · 리텐션 (일자별) */}
      <TrafficSection from={from} to={to} series={series} summary={retention} />

      {/* 퍼널 */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="card p-5">
            <div className="text-xs text-sub">{s.label}</div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs text-brand">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 매출 요약 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs text-sub">확정 매출</div>
          <div className="mt-2 text-xl font-bold">{won(funnel.salesAmount)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-sub">확정 수수료</div>
          <div className="mt-2 text-xl font-bold text-brand">{won(funnel.commission)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-sub">조회당 코드생성률</div>
          <div className="mt-2 text-xl font-bold">{viewToLink.toFixed(1)}%</div>
        </div>
      </div>

      {/* 인기 상품 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopTable title="조회수 TOP 10" rows={top.byViews} metric="views" />
        <TopTable title="코드생성 TOP 10" rows={top.byLinks} metric="links" />
      </div>
    </div>
  );
}

function TopTable({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: { id: string; goodsNo: string; name: string; brand: string | null; views: number; links: number }[];
  metric: "views" | "links";
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <div className="card p-6 text-sm text-sub">데이터가 없습니다.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f6f4] text-left text-xs text-sub">
              <tr>
                <th className="w-8 px-2 py-2">#</th>
                <th className="px-2 py-2">상품</th>
                <th className="w-16 px-2 py-2 text-right">조회</th>
                <th className="w-16 px-2 py-2 text-right">코드</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-2 py-1.5 text-sub">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <Link href={`/goods/${r.goodsNo}`} target="_blank" className="line-clamp-1 hover:text-brand">
                      {r.name}
                    </Link>
                    <span className="text-xs text-sub">{r.brand ?? ""}</span>
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${metric === "views" ? "font-bold text-brand" : "text-ink/70"}`}>
                    {r.views.toLocaleString()}
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${metric === "links" ? "font-bold text-brand" : "text-ink/70"}`}>
                    {r.links.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
