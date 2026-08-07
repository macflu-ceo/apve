// MD 데일리 리포트 빌더 — 전일(KST) 기준 핵심 지표 텍스트 생성
import { prisma } from "@/lib/db";
import { getFunnel, getVisitorFunnel, getAcquisition, getRetentionSummary, getAppCtaPerformance } from "@/lib/analytics";
import { readFileSync } from "node:fs";

const KST = 9 * 3600 * 1000;
function kstDate(offsetDays = 0): string {
  const d = new Date(Date.now() + KST + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
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
  return n.toLocaleString();
}
function pct(a: number, b: number): number { return b > 0 ? (a / b) * 100 : 0; }
function delta(cur: number, prev: number): string {
  if (prev <= 0) return "";
  const d = ((cur - prev) / prev) * 100;
  const s = d >= 0 ? "▲" : "▼";
  return ` (${s}${Math.abs(d).toFixed(0)}%)`;
}

function currentTheme(): { title: string; hero?: string } | null {
  try {
    const raw = JSON.parse(readFileSync(process.cwd() + "/scripts/themes.json", "utf8"));
    const t = (raw.themes || []).find((x: { week: number }) => x.week === raw.pointer);
    return t ? { title: t.title, hero: t.hero } : null;
  } catch { return null; }
}

export interface DailyReport { date: string; text: string }

export async function buildDailyReport(dateStr?: string): Promise<DailyReport> {
  const y = dateStr ?? kstDate(-1);       // 어제
  const prev = addDays(y, -1);            // 그제(비교용)
  const w7from = addDays(y, -6);

  // 안전하게 병렬 수집 (하나 실패해도 나머지 유지)
  const safe = async <T>(p: Promise<T>, fb: T): Promise<T> => p.catch(() => fb);
  const emptyVF = { visitors: 0, viewers: 0, coders: 0 };
  const range = { gte: new Date(y + "T00:00:00+09:00"), lte: new Date(y + "T23:59:59+09:00") };
  const [funnel, funnelPrev, vfAll, vfWeb, vfApp, acq, ret7, installs, canceled, totalSales, ctaY] = await Promise.all([
    safe(getFunnel(y, y), { signups: 0, productViews: 0, linksCreated: 0, salesCount: 0, salesAmount: 0, commission: 0 }),
    safe(getFunnel(prev, prev), { signups: 0, productViews: 0, linksCreated: 0, salesCount: 0, salesAmount: 0, commission: 0 }),
    safe(getVisitorFunnel(y, y), { ...emptyVF }),
    safe(getVisitorFunnel(y, y, "web"), { ...emptyVF }),
    safe(getVisitorFunnel(y, y, "app"), { ...emptyVF }),
    safe(getAcquisition(y, y), { referrers: [], campaigns: [], referredSessions: 0 }),
    safe(getRetentionSummary(w7from, y), { visitors: 0, returningVisitors: 0, returnRate: 0, sessions: 0, visitsPerVisitor: 0, pageViews: 0, pagesPerSession: 0, loggedInVisitors: 0 }),
    safe(prisma.pushToken.count({ where: { createdAt: range } }), 0),
    safe(prisma.sale.count({ where: { orderedAt: range, status: "canceled" } }), 0),
    safe(prisma.sale.count({ where: { orderedAt: range } }), 0),
    safe(getAppCtaPerformance(y, y), [] as { source: string; label: string; impressions: number; clicks: number; ctr: number }[]),
  ]);

  const totalVisits = vfWeb.visitors + vfApp.visitors || vfAll.visitors;
  const appShare = pct(vfApp.visitors, totalVisits);
  const ctaClicks = ctaY.reduce((a, r) => a + r.clicks, 0);
  const webToAppRate = pct(installs, vfWeb.visitors);
  const convLinkToSale = pct(funnel.salesCount, funnel.linksCreated);
  const convPrev = pct(funnelPrev.salesCount, funnelPrev.linksCreated);
  const cancelRate = pct(canceled, totalSales);
  const topRef = acq.referrers.slice(0, 3).map((r) => `${r.referrer} ${Math.round(pct(r.sessions, acq.referredSessions))}%`).join(" · ") || "—";

  // 이상징후
  const alerts: string[] = [];
  if (cancelRate >= 7) alerts.push(`취소율 ${cancelRate.toFixed(0)}% 급등 — 확인필요`);
  if (funnelPrev.salesAmount > 0 && funnel.salesAmount < funnelPrev.salesAmount * 0.5) alerts.push(`GMV 전일 대비 반토막 — 확인필요`);
  if (totalVisits > 0 && convPrev > 0 && convLinkToSale < convPrev * 0.6) alerts.push(`링크→판매 전환율 급락 — 확인필요`);

  const theme = currentTheme();
  const L: string[] = [];
  L.push(`📊 <b>돈버는명품샵 데일리</b> [${y.slice(5)}(${dow(y)})]`);
  L.push(`━ 어제 성과`);
  L.push(`· GMV(확정) ${won(funnel.salesAmount)}${delta(funnel.salesAmount, funnelPrev.salesAmount)} · 수수료 ${won(funnel.commission)} · 판매 ${funnel.salesCount}건`);
  L.push(`· 링크→판매 전환율 ${convLinkToSale.toFixed(1)}%${delta(convLinkToSale, convPrev)}`);
  L.push(`━ 유입`);
  L.push(`· 방문 ${totalVisits} (웹 ${vfWeb.visitors} / 앱 ${vfApp.visitors}) · 신규가입 ${funnel.signups}`);
  L.push(`· 톱 유입: ${topRef}`);
  L.push(`━ 셀러 활동`);
  L.push(`· 활성 공유셀러 ${vfAll.coders}명 · 링크생성 ${funnel.linksCreated} · 상품조회 ${funnel.productViews}`);
  L.push(`━ 앱`);
  L.push(`· 앱유도클릭 ${ctaClicks} · 신규설치 ${installs} · 앱비중 ${appShare.toFixed(0)}% · 웹→앱 ${webToAppRate.toFixed(1)}%`);
  L.push(`━ 리텐션(7일)`);
  L.push(`· 재방문율 ${ret7.returnRate.toFixed(0)}% · 회원방문 ${ret7.loggedInVisitors}`);
  L.push(alerts.length ? `⚠️ ${alerts.join(" / ")}` : `✅ 이상징후 없음`);
  L.push(`🎯 이번 주 테마: ${theme ? theme.title : "미설정"} — 오늘 홈/기획전/배너 신선화`);

  return { date: y, text: L.join("\n") };
}
