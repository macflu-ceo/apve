// 파트너 인증 코어 (서버 전용)
// - 비밀번호: scrypt 해시 (외부 의존성 없음)
// - 세션: HMAC 서명된 httpOnly 쿠키에 partnerId 저장
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const COOKIE = "partner_session";

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

function sign(v: string): string {
  return crypto.createHmac("sha256", SECRET).update(v).digest("hex");
}

export function setSession(partnerId: string) {
  const token = `${partnerId}.${sign(partnerId)}`;
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

/** 현재 로그인된 파트너 반환(승인대기 포함, 반려/비활성 제외), 없으면 null */
export async function getSessionPartner() {
  const c = cookies().get(COOKIE)?.value;
  if (!c) return null;
  const [id, sig] = c.split(".");
  if (!id || !sig || sign(id) !== sig) return null;
  const p = await prisma.partner.findUnique({ where: { id } });
  if (!p || !p.active || p.status === "rejected") return null;
  return p;
}
