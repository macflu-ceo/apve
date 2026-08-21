import Link from "next/link";
import { won } from "@/lib/format";
import {
  getFunnel,
  getTopProducts,
  getDailySeries,
  getRetentionSummary,
  getActiveUsers,
  getCohorts,
  getVisitorFunnel,
  getAcquisition,
  getAppCtaPerformance,
  getAppConversionFunnel,
} from "@/lib/analytics";
import type { RetentionSummary } from "@/lib/analytics";
import DateRange from "./DateRange";
import TrafficSection from "./TrafficSection";
import GrowthSection from "./GrowthSection";

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
  const pf = searchParams.platform === "app" ? "app" : searchParams.platform === "web" ? "web" : undefined;

  const [funnel, top, series, retention, webSum, appSum, active, cohorts, vFunnel, acq, appCta, appFunnel] = await Promise.all([
    getFunnel(from, to),
    getTopProducts(from, to, 10),
    getDailySeries(from, to, pf),
    getRetentionSummary(from, to, pf),
    getRetentionSummary(from, to, "web"),
    getRetentionSummary(from, to, "app"),
    getActiveUsers(to, pf),
    getCohorts(to, pf),
    getVisitorFunnel(from, to, pf),
    getAcquisition(from, to, pf),
    getAppCtaPerformance(from, to),
    getAppConversionFunnel(from, to),
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

      {/* 웹 vs 앱 비교 */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <PlatformCard label="웹" sum={webSum} active={pf === "web"} from={from} to={to} platform="web" />
        <PlatformCard label="앱" sum={appSum} active={pf === "app"} from={from} to={to} platform="app" />
      </div>
      <div className="mb-3 text-xs text-sub">
        아래 지표는{" "}
        {pf ? (
          <>
            <b>{pf === "app" ? "앱" : "웹"}</b> 기준입니다.{" "}
            <PlatformToggle from={from} to={to} label="전체 보기" platform={undefined} />
          </>
        ) : (
          <>
            <b>전체(웹+앱)</b> 기준입니다.{" "}
            <PlatformToggle from={from} to={to} label="웹만" platform="web" />{" · "}
            <PlatformToggle from={from} to={to} label="앱만" platform="app" />
          </>
        )}
      </div>

      {/* 방문 · 리텐션 (일자별) */}
      <TrafficSection from={from} to={to} series={series} summary={retention} />

      {/* 성장 지표: 활성사용자 · 퍼널 · 코호트 · 유입경로 */}
      <GrowthSection
        asOf={to}
        active={active}
        cohorts={cohorts}
        funnel={vFunnel}
        signups={funnel.signups}
        salesCount={funnel.salesCount}
        acq={acq}
        totalSessions={retention.sessions}
      />

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

      {/* 웹 → 앱 전환 퍼널 */}
      <AppFunnelSection f={appFunnel} />

      {/* 앱 유도 성과 (장치별 노출·클릭·전환율) */}
      <AppCtaSection rows={appCta} />

      {/* 인기 상품 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopTable title="조회수 TOP 10" rows={top.byViews} metric="views" />
        <TopTable title="코드생성 TOP 10" rows={top.byLinks} metric="links" />
      </div>
    </div>
  );
}

/** 웹 → 앱 전환 퍼널 — 유도 노출 → 클릭 → 앱 접속 → 설치완료(고유 인원) */
function AppFunnelSection({ f }: { f: import("@/lib/analytics").AppFunnel }) {
  const steps = [
    { label: "앱 유도 노출", sub: "유도를 본 방문자", value: f.ctaImpressions, base: true },
    { label: "앱 유도 클릭", sub: "스토어로 이동", value: f.ctaClicks },
    { label: "앱 접속", sub: "실제 앱으로 들어온 방문자", value: f.appVisitors },
    { label: "설치 완료", sub: "앱 첫 로그인(보상 지급)", value: f.installs },
  ];
  const top = Math.max(f.ctaImpressions, 1);
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  const empty = f.ctaImpressions + f.ctaClicks + f.appVisitors + f.installs === 0;
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-lg font-bold">웹 → 앱 전환 퍼널</h2>
      <p className="mb-3 text-xs text-sub">
        유도 노출 → 클릭 → 앱 접속 → <b>설치 완료(첫 앱 로그인)</b>까지 고유 인원 기준. 단계별로 얼마나 빠지는지 본다.
      </p>
      {empty ? (
        <div className="card p-6 text-sm text-sub">아직 앱 전환 기록이 없습니다. (앱 출시·스토어 URL 설정 후 집계 시작)</div>
      ) : (
        <div className="card p-5">
          <div className="space-y-2.5">
            {steps.map((s, i) => {
              const prev = i > 0 ? steps[i - 1].value : s.value;
              const width = Math.max((s.value / top) * 100, s.value > 0 ? 4 : 0);
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-right text-xs">
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[10px] text-sub">{s.sub}</div>
                  </div>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-line/60">
                    <div
                      className="flex h-full items-center rounded-lg bg-gradient-to-r from-brand/80 to-brand px-3 text-xs font-bold text-white"
                      style={{ width: `${width}%`, minWidth: s.value > 0 ? "2.5rem" : 0 }}
                    >
                      {s.value.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-xs tabular-nums text-sub">
                    {i === 0 ? "기준" : `${pct(s.value, prev)}%`}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-line pt-3 text-xs text-sub">
            전체 전환율(노출→설치): <b className="text-brand">{pct(f.installs, f.ctaImpressions)}%</b>
            <span className="ml-2">· 오른쪽 %는 직전 단계 대비 잔존율</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** 앱 유도 장치별 성과 표 — 어느 방식이 앱 전환을 잘 시키고 어떤 게 저조한지 (고유 인원 기준) */
function AppCtaSection({ rows }: { rows: import("@/lib/analytics").AppCtaRow[] }) {
  const scored = rows.filter((r) => r.impressions > 0); // 전환율 산출 가능한 방식(이미 전환율 내림차순 정렬)
  const best = scored[0];
  const worst = scored.length > 1 ? scored[scored.length - 1] : undefined;
  const maxCtr = Math.max(...scored.map((r) => r.ctr), 1);
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-lg font-bold">앱 유도 성과 — 방식별 전환율</h2>
      <p className="mb-3 text-xs text-sub">
        각 유도 방식을 <b>본 사람(고유) 중 몇 %가 앱으로 넘어갔나</b>. 전환율 높은 순. 잘되는 방식은 늘리고 저조한 건 교체·제거.
      </p>
      {rows.length === 0 ? (
        <div className="card p-6 text-sm text-sub">아직 앱 유도 기록이 없습니다. (앱 출시·스토어 URL 설정 후 집계 시작)</div>
      ) : (
        <>
          {best && (
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-700">
                🥇 가장 잘 전환: {best.label} <b>{best.ctr}%</b>
              </span>
              {worst && (
                <span className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600">
                  ⚠️ 가장 저조: {worst.label} <b>{worst.ctr}%</b>
                </span>
              )}
            </div>
          )}
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr>
                  <th className="px-4 py-3">유도 방식</th>
                  <th className="px-4 py-3 text-right">본 사람</th>
                  <th className="px-4 py-3 text-right">넘어간 사람</th>
                  <th className="px-4 py-3">전환율 (본 사람 중)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const hasImp = r.impressions > 0;
                  const isBest = hasImp && r === best;
                  return (
                    <tr key={r.source} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-semibold">
                        {r.label}
                        <span className="ml-2 text-[10px] text-sub">app_cta_{r.source}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-brand">{r.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {hasImp ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60">
                              <div
                                className={`h-full rounded-full ${isBest ? "bg-emerald-500" : "bg-brand"}`}
                                style={{ width: `${Math.max((r.ctr / maxCtr) * 100, r.ctr > 0 ? 4 : 0)}%` }}
                              />
                            </div>
                            <span className="w-12 shrink-0 text-right text-xs font-bold tabular-nums">{r.ctr}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-sub">노출 데이터 없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** 플랫폼 필터 링크 (from/to 유지) */
function PlatformToggle({
  from,
  to,
  label,
  platform,
}: {
  from: string;
  to: string;
  label: string;
  platform?: "web" | "app";
}) {
  const sp = new URLSearchParams({ from, to });
  if (platform) sp.set("platform", platform);
  return (
    <Link href={`/admin/analytics?${sp.toString()}`} className="text-brand underline hover:opacity-80">
      {label}
    </Link>
  );
}

/** 웹/앱 요약 비교 카드 */
function PlatformCard({
  label,
  sum,
  active,
  from,
  to,
  platform,
}: {
  label: string;
  sum: RetentionSummary;
  active: boolean;
  from: string;
  to: string;
  platform: "web" | "app";
}) {
  const sp = new URLSearchParams({ from, to, platform });
  return (
    <Link
      href={`/admin/analytics?${sp.toString()}`}
      className={`card block p-5 transition ${active ? "ring-2 ring-brand" : "hover:border-ink/20"}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold">{label === "앱" ? "📱 앱" : "🌐 웹"}</span>
        <span className="text-xs text-sub">방문자</span>
      </div>
      <div className="mt-1 text-2xl font-bold">{sum.visitors.toLocaleString()}명</div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-sub">
        <span>재방문율 <b className="text-ink">{sum.returnRate.toFixed(0)}%</b></span>
        <span>1인당 <b className="text-ink">{sum.visitsPerVisitor.toFixed(1)}회</b></span>
        <span>세션당 <b className="text-ink">{sum.pagesPerSession.toFixed(1)}p</b></span>
        <span>회원 <b className="text-ink">{sum.loggedInVisitors.toLocaleString()}명</b></span>
      </div>
    </Link>
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
