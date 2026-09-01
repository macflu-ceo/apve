// MD 정기 보고 빌더 — 일/주/월 단위 (KST)
//  · 평일: 일보고(전일)   · 월요일: 주보고(지난 7일, WAU)   · 매월 1일: 월보고(지난달, MAU)
//  · 항목은 동일, 단위만 DAU→WAU/MAU 로 바뀜
import { prisma } from "@/lib/db";
import { getFunnel, getVisitorFunnel, getRetentionSummary } from "@/lib/analytics";

export type Period = "day" | "week" | "month";

const KST = 9 * 3600 * 1000;
function shift(days: number): string {
  return new Date(Date.now() + KST + days * 86400000).toISOString().slice(0, 10);
}
function addDays(s: string, n: number): string {
  const d = new Date(s + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dow(s: string): string {
  return ["일", "월", "화", "수", "목", "금", "토"][new Date(s + "T00:00:00+09:00").getUTCDay()];
}
function won(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(n % 100000000 === 0 ? 0 : 1) + "억";
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + "만";
  return Math.round(n).toLocaleString();
}
function pct(a: number, b: number): number { return b > 0 ? (a / b) * 100 : 0; }
function delta(cur: number, prev: number): string {
  if (prev <= 0) return "";
  const d = ((cur - prev) / prev) * 100;
  return ` (${d >= 0 ? "▲" : "▼"}${Math.abs(d).toFixed(0)}%)`;
}

interface Win { from: string; to: string; pFrom: string; pTo: string; label: string; uau: string; head: string; icon: string }

/** period + 오늘(KST) 기준으로 집계 창과 직전 비교 창을 계산 */
function windows(period: Period): Win {
  if (period === "month") {
    const n = new Date(Date.now() + KST);
    const y = n.getUTCFullYear(), m = n.getUTCMonth(); // 이번달 m(0-based)
    const from = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);   // 지난달 1일
    const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);         // 지난달 말일
    const pFrom = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);  // 전전달 1일
    const pTo = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);    // 전전달 말일
    return { from, to, pFrom, pTo, label: `${from.slice(0, 7)} 월보고`, uau: "MAU", head: "지난달 성과", icon: "🗓️" };
  }
  if (period === "week") {
    const to = shift(-1);                 // 어제(일요일)
    const from = addDays(to, -6);         // 7일 전(월요일)
    const pTo = addDays(from, -1);
    const pFrom = addDays(pTo, -6);
    return { from, to, pFrom, pTo, label: `${from.slice(5)}~${to.slice(5)} 주보고`, uau: "WAU", head: "지난주 성과", icon: "📈" };
  }
  const to = shift(-1); // 어제
  const pTo = addDays(to, -1);
  return { from: to, to, pFrom: pTo, pTo, label: `${to.slice(5)}(${dow(to)}) 일보고`, uau: "DAU", head: "어제 성과", icon: "📊" };
}

export interface Report { period: Period; from: string; to: string; text: string }

export async function buildReport(period: Period = "day"): Promise<Report> {
  const w = windows(period);
  const safe = async <T>(p: Promise<T>, fb: T): Promise<T> => p.catch(() => fb);
  const emptyF = { signups: 0, productViews: 0, linksCreated: 0, salesCount: 0, salesAmount: 0, commission: 0 };
  const emptyVF = { visitors: 0, viewers: 0, coders: 0 };
  const emptyRet = { visitors: 0, returningVisitors: 0, returnRate: 0, sessions: 0, visitsPerVisitor: 0, pageViews: 0, pagesPerSession: 0, loggedInVisitors: 0 };
  const range = { gte: new Date(w.from + "T00:00:00+09:00"), lte: new Date(w.to + "T23:59:59+09:00") };

  const [funnel, funnelPrev, vfWeb, vfApp, ret, installs, canceled, totalSales, settleReq, pendingAgg] = await Promise.all([
    safe(getFunnel(w.from, w.to), { ...emptyF }),
    safe(getFunnel(w.pFrom, w.pTo), { ...emptyF }),
    safe(getVisitorFunnel(w.from, w.to, "web"), { ...emptyVF }),
    safe(getVisitorFunnel(w.from, w.to, "app"), { ...emptyVF }),
    safe(getRetentionSummary(w.from, w.to), { ...emptyRet }),
    safe(prisma.pushToken.count({ where: { createdAt: range } }), 0),
    safe(prisma.sale.count({ where: { orderedAt: range, status: "canceled" } }), 0),
    safe(prisma.sale.count({ where: { orderedAt: range } }), 0),
    safe(prisma.partner.count({ where: { settlementAgreedAt: range } }), 0),
    safe(prisma.sale.aggregate({ _sum: { commission: true }, _count: true, where: { status: "confirmed", paidOut: false } }), { _sum: { commission: 0 }, _count: 0 }),
  ]);

  const uauCount = vfWeb.visitors + vfApp.visitors;
  const appShare = pct(vfApp.visitors, uauCount);
  const cancelRate = pct(canceled, totalSales);
  const pendingPay = pendingAgg._sum.commission ?? 0;
  const pendingCnt = pendingAgg._count ?? 0;

  // 이상징후(요약)
  const alerts: string[] = [];
  if (cancelRate >= 7) alerts.push(`취소율 ${cancelRate.toFixed(0)}%`);
  if (funnelPrev.salesAmount > 0 && funnel.salesAmount < funnelPrev.salesAmount * 0.5) alerts.push(`GMV 반토막`);

  const L: string[] = [];
  L.push(`${w.icon} <b>돈버는명품샵 ${w.label}</b>`);
  L.push(`━ ${w.head}`);
  L.push(`· GMV(확정) ${won(funnel.salesAmount)}${delta(funnel.salesAmount, funnelPrev.salesAmount)} · 수수료 ${won(funnel.commission)} · 판매 ${funnel.salesCount}건 (취소 ${canceled})`);
  L.push(`━ 트래픽`);
  L.push(`· ${w.uau} ${uauCount.toLocaleString()} (웹 ${vfWeb.visitors} / 앱 ${vfApp.visitors}) · 앱비중 ${appShare.toFixed(0)}%`);
  L.push(`· 신규가입 ${funnel.signups}${delta(funnel.signups, funnelPrev.signups)} · 앱설치(추정) ${installs}`);
  L.push(`━ 리텐션`);
  L.push(`· 재방문율 ${ret.returnRate.toFixed(0)}% · 회원방문 ${ret.loggedInVisitors}`);
  L.push(`━ 정산`);
  L.push(`· 신규 정산신청 ${settleReq}건 · 정산대기 ${won(pendingPay)} (${pendingCnt}건)`);
  L.push(alerts.length ? `⚠️ ${alerts.join(" / ")} — 확인필요` : `✅ 이상징후 없음`);

  return { period, from: w.from, to: w.to, text: L.join("\n") };
}

/** 오늘(KST) 기준 자동 단위 선택: 매월 1일→월, 월요일→주, 그 외→일 */
export function pickPeriod(): Period {
  const n = new Date(Date.now() + KST);
  if (n.getUTCDate() === 1) return "month";
  if (n.getUTCDay() === 1) return "week"; // 월요일
  return "day";
}
