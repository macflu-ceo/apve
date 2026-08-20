// 고도몰 영업사원 회원 자동 등록 — 가입 시 판매코드(memId)로 '영업사원(groupSno=2)' 회원 생성.
// 커스텀 API: api.viaelite.co.kr/concierge/agent (AgentController.php)
const API_BASE = process.env.GODO_SALES_API_URL || "https://api.viaelite.co.kr/concierge/sales";
const API_KEY = process.env.GODO_SALES_API_KEY || "";

function agentUrl(): string {
  return API_BASE.replace(/\/sales$/, "/agent");
}

/** 영업사원 회원 생성 (멱등 — 이미 있으면 성공). 실패해도 가입은 막지 않는다. */
export async function createGodoAgent(code: string, name: string, email?: string): Promise<{ ok: boolean; message?: string }> {
  if (!API_KEY) return { ok: false, message: "GODO_SALES_API_KEY 미설정" };
  try {
    const url = new URL(agentUrl());
    url.searchParams.set("action", "create");
    url.searchParams.set("code", code);
    url.searchParams.set("name", name);
    if (email) url.searchParams.set("email", email);
    const res = await fetch(url.toString(), { headers: { "X-API-KEY": API_KEY }, cache: "no-store" });
    const d = await res.json().catch(() => null);
    if (!d?.ok) return { ok: false, message: d?.error || `HTTP ${res.status}` };
    // 컨시어지 할인율 5% 고정 (신규·기존 무관, 멱등)
    const rateUrl = new URL(agentUrl());
    rateUrl.searchParams.set("action", "setrate");
    rateUrl.searchParams.set("col", "salesDiscountRate");
    rateUrl.searchParams.set("rate", "5.00");
    rateUrl.searchParams.set("code", code);
    await fetch(rateUrl.toString(), { headers: { "X-API-KEY": API_KEY }, cache: "no-store" }).catch(() => {});
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "agent api error" };
  }
}

/** 보정 — 코드 보유 활성 회원 전원을 고도몰 영업사원으로 보장 (멱등, 크론에서 매일) */
export async function ensureGodoAgents(): Promise<{ checked: number; created: number; failed: number }> {
  const { prisma } = await import("@/lib/db");
  const partners = await prisma.partner.findMany({
    where: { active: true, code: { not: null } },
    select: { code: true, name: true, email: true },
  });
  let created = 0;
  let failed = 0;
  for (const p of partners) {
    const r = await createGodoAgent(p.code as string, p.name, p.email ?? undefined);
    if (r.ok) created++;
    else failed++;
  }
  return { checked: partners.length, created, failed };
}
