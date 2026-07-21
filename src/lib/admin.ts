// 어드민 로그인 (아이디+비밀번호) — 환경변수 ADMIN_USER / ADMIN_PASSWORD
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const COOKIE = "admin_session";
const ADMIN_USER = process.env.ADMIN_USER || "admin";

function sign(v: string) {
  return crypto.createHmac("sha256", SECRET).update(v).digest("hex");
}

/** 아이디/비밀번호 검증 (ADMIN_PASSWORD 미설정 시 항상 실패) */
export function checkAdmin(user: string, pw: string): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  return user.trim() === ADMIN_USER && pw === pass;
}

export function setAdminSession() {
  cookies().set(COOKIE, `ok.${sign("ok")}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminSession() {
  cookies().delete(COOKIE);
}

/** 어드민 로그인 여부 */
export function isAdmin(): boolean {
  const c = cookies().get(COOKIE)?.value;
  if (!c) return false;
  const [v, sig] = c.split(".");
  return v === "ok" && sig === sign("ok");
}
