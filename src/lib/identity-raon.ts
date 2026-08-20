// 라온 OmniOne CX 본인확인 — 브로커(Railway) 연동 + 인증결과 티켓(서명 쿠키)
//
// 흐름: /auth/identity/start?flow=… → 브로커 /start(카카오/토스 인증창)
//   → 브로커가 /auth/identity/callback?code=… 로 복귀
//   → 서버가 브로커 /result 에서 CI·이름·전화 수령 → 10분짜리 서명 쿠키(iv_ticket)
//   → 가입/아이디찾기/비번재설정 액션이 쿠키에서 읽음 (클라이언트는 CI를 절대 못 만짐)
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const TICKET_COOKIE = "iv_ticket";
const TICKET_TTL_MS = 10 * 60 * 1000; // 10분

export type IdentityFlow = "signup" | "find-id" | "reset-pw";

export interface IdentityTicket {
  ci: string;
  di: string | null;
  name: string;
  phone: string;
  flow: IdentityFlow;
  iat: number; // 발급 시각(ms)
}

function hmac(v: string): string {
  return crypto.createHmac("sha256", SECRET).update(v).digest("base64url");
}

export function brokerOrigin(): string | null {
  const o = (process.env.RAON_AUTH_ORIGIN || "").trim().replace(/\/$/, "");
  return o || null;
}

export function isRaonConfigured(): boolean {
  return !!brokerOrigin() && !!process.env.RAON_BROKER_SECRET;
}

/** 브로커에서 일회용 code로 인증 결과 수령 (서버-서버) */
export async function fetchBrokerResult(code: string): Promise<
  { ok: true; ci: string; di: string | null; name: string; phone: string } | { ok: false; message: string }
> {
  const origin = brokerOrigin();
  const secret = process.env.RAON_BROKER_SECRET;
  if (!origin || !secret) return { ok: false, message: "본인인증 서버 설정이 없습니다." };
  try {
    const res = await fetch(`${origin}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-broker-secret": secret },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, message: `본인인증 결과 조회 실패 (${res.status})` };
    const d = await res.json();
    if (!d?.ok || !d?.ci) return { ok: false, message: d?.message || "본인인증 결과가 유효하지 않습니다." };
    return {
      ok: true,
      ci: String(d.ci),
      di: d.di ? String(d.di) : null,
      name: String(d.name || ""),
      phone: String(d.phone || "").replace(/-/g, ""),
    };
  } catch {
    return { ok: false, message: "본인인증 서버에 연결할 수 없습니다." };
  }
}

/** 인증결과 → 서명 쿠키 저장 (10분) */
export function setIdentityTicket(t: Omit<IdentityTicket, "iat">): void {
  const payload = Buffer.from(JSON.stringify({ ...t, iat: Date.now() })).toString("base64url");
  cookies().set(TICKET_COOKIE, `${payload}.${hmac(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TICKET_TTL_MS / 1000,
    path: "/",
  });
}

/** 서명·만료 검증 후 티켓 반환 (없거나 위조·만료면 null) */
export function getIdentityTicket(): IdentityTicket | null {
  const raw = cookies().get(TICKET_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || hmac(payload) !== sig) return null;
  try {
    const t = JSON.parse(Buffer.from(payload, "base64url").toString()) as IdentityTicket;
    if (!t.ci || Date.now() - t.iat > TICKET_TTL_MS) return null;
    return t;
  } catch {
    return null;
  }
}

export function clearIdentityTicket(): void {
  cookies().delete(TICKET_COOKIE);
}
