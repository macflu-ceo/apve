// 웹 → 앱 전환 리포트 빌더
// 데이터: app_cta_<source>(노출/클릭) · /app 스마트링크(app_smartlink_<device>) · PushToken(설치) · platform=app(앱 방문)
import { prisma } from "@/lib/db";
import { getAppCtaPerformance, getVisitorFunnel } from "@/lib/analytics";
import { Prisma } from "@prisma/client";

const SRC_KR: Record<string, string> = {
  topbar: "상단바", upsell: "상품 업셀", codelimit: "코드한도",
  pop5: "팝업(5회)", pop20: "팝업(20회)", pop40: "팝업(40회)",
};
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const num = (v: unknown) => Number(v ?? 0);

export interface WebToAppReport { from: string; to: string; text: string }

export async function buildWebToAppReport(from: string, to: string): Promise<WebToAppReport> {
  const safe = async <T>(p: Promise<T>, fb: T): Promise<T> => p.catch(() => fb);
  const range = { gte: new Date(from + "T00:00:00+09:00"), lte: new Date(to + "T23:59:59+09:00") };

  const [cta, vfWeb, vfApp, installs, smartRows] = await Promise.all([
    safe(getAppCtaPerformance(from, to), [] as { source: string; label: string; impressions: number; clicks: number; ctr: number }[]),
    safe(getVisitorFunnel(from, to, "web"), { visitors: 0, viewers: 0, coders: 0 }),
    safe(getVisitorFunnel(from, to, "app"), { visitors: 0, viewers: 0, coders: 0 }),
    safe(prisma.pushToken.count({ where: { createdAt: range } }), 0),
    safe(
      prisma.$queryRaw<{ label: string; n: bigint }[]>(Prisma.sql`
        SELECT label, COUNT(*) AS n FROM "Visit"
        WHERE label LIKE 'app_smartlink_%' AND day >= ${from} AND day <= ${to}
        GROUP BY label`),
      [] as { label: string; n: bigint }[]
    ),
  ]);

  const smart: Record<string, number> = { ios: 0, android: 0, pc: 0 };
  for (const r of smartRows) { const d = r.label.replace("app_smartlink_", ""); if (d in smart) smart[d] = num(r.n); }
  const smartTotal = smart.ios + smart.android + smart.pc;
  const totalClicks = cta.reduce((a, r) => a + r.clicks, 0);
  const totalImp = cta.reduce((a, r) => a + r.impressions, 0);
  const webToAppRate = pct(installs, vfWeb.visitors); // 설치/웹방문 (proxy)
  const bestSrc = [...cta].filter((r) => r.impressions >= 10).sort((a, b) => b.ctr - a.ctr)[0];

  const L: string[] = [];
  L.push(`📱 <b>웹→앱 전환 리포트</b> [${from.slice(5)}–${to.slice(5)}]`);
  L.push(`━ 앱 유도 장치 (노출→클릭·CTR)`);
  if (cta.length) {
    for (const r of cta.sort((a, b) => b.clicks - a.clicks)) {
      L.push(`· ${SRC_KR[r.source] || r.source}  ${r.impressions.toLocaleString()}→${r.clicks} (${r.ctr}%)`);
    }
    L.push(`· 합계 노출 ${totalImp.toLocaleString()} · 클릭 ${totalClicks} (평균 CTR ${pct(totalClicks, totalImp).toFixed(1)}%)`);
  } else L.push(`· (데이터 없음)`);
  L.push(`━ 스마트링크(/app) 스토어 이동`);
  L.push(`· iOS ${smart.ios} · Android ${smart.android} · PC ${smart.pc} (합 ${smartTotal})`);
  L.push(`━ 전환`);
  L.push(`· 신규 설치 ${installs} · 앱 방문 ${vfApp.visitors} · 웹 방문 ${vfWeb.visitors}`);
  L.push(`· 웹→앱 전환율(설치/웹방문) ${webToAppRate.toFixed(2)}%`);
  L.push(`━ 인사이트`);
  if (bestSrc) L.push(`· 전환율 톱 장치: ${SRC_KR[bestSrc.source] || bestSrc.source} (${bestSrc.ctr}%) — 노출 확대 여지`);
  if (smartTotal > 0) L.push(`· 기기 비중: Android ${pct(smart.android, smartTotal).toFixed(0)}% vs iOS ${pct(smart.ios, smartTotal).toFixed(0)}%`);
  if (!bestSrc && smartTotal === 0) L.push(`· 아직 표본이 적어요 — 앱 유도 노출이 쌓이면 장치별 최적화가 가능해집니다.`);

  return { from, to, text: L.join("\n") };
}
