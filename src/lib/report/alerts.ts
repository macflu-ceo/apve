// 실시간 운영 알림 (텔레그램) — MD 알림 채널
// 이벤트 발생 즉시 발송. 절대 유저 흐름을 막지 않도록 항상 예외를 삼킨다(fire-and-forget).
//   1) 회원가입  2) 커뮤니티 글 작성  3) 컨시어지 신청  4) 판매(전체)  5) 장애 신호
import { sendTelegram } from "@/lib/telegram";

function esc(s: unknown): string {
  return String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
}
const won = (n: number) => Math.round(n || 0).toLocaleString("ko-KR");

/** 실제 발송 — 실패해도 조용히 무시 */
async function fire(text: string): Promise<void> {
  try { await sendTelegram(text); } catch { /* 알림 실패는 무시 */ }
}

/** 1. 신규 회원가입 */
export function alertSignup(p: { name?: string | null; username?: string | null; code?: string | null }): Promise<void> {
  return fire(
    `🆕 <b>신규 회원가입</b>\n· ${esc(p.name) || "회원"} (@${esc(p.username)})` +
    (p.code ? ` · 코드 ${esc(p.code)}` : "")
  );
}

/** 2. 커뮤니티/건의 글 작성 */
export function alertCommunityPost(p: { category?: string; title?: string; nickname?: string | null }): Promise<void> {
  return fire(
    `✍️ <b>커뮤니티 새 글</b>${p.category ? ` [${esc(p.category)}]` : ""}\n· ${esc(p.title)} — ${esc(p.nickname) || "회원"}`
  );
}

/** 3. 컨시어지 가입신청 */
export function alertConcierge(p: { name?: string; phone?: string; job?: string | null; region?: string | null }): Promise<void> {
  return fire(
    `💼 <b>컨시어지 신청</b>\n· ${esc(p.name)} · ${esc(p.phone)}` +
    (p.job ? ` · ${esc(p.job)}` : "") + (p.region ? ` · ${esc(p.region)}` : "")
  );
}

/** 4. 판매 발생 (전체) */
export function alertSale(p: { goodsName?: string | null; amount: number; commission: number; code?: string | null; status?: string }): Promise<void> {
  const tag = p.status && p.status !== "confirmed" ? ` [${esc(p.status)}]` : "";
  return fire(
    `💰 <b>판매 발생</b>${tag}\n· ${esc(p.goodsName) || "상품"}\n· ${won(p.amount)}원 · 수수료 ${won(p.commission)}원 · 코드 ${esc(p.code) || "-"}`
  );
}

// 5. 장애 신호 — 같은 지점은 10분에 한 번만 (알림 폭탄 방지, 서버리스에선 best-effort)
const lastErr = new Map<string, number>();
export function alertError(where: string, err: unknown): Promise<void> {
  const now = Date.now();
  if ((lastErr.get(where) || 0) > now - 10 * 60_000) return Promise.resolve();
  lastErr.set(where, now);
  const msg = err instanceof Error ? err.message : String(err);
  return fire(`🚨 <b>장애 신호</b> [${esc(where)}]\n· ${esc(msg).slice(0, 300)}`);
}
