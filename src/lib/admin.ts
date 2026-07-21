// 어드민 로그인 (아이디+비밀번호) — 환경변수 ADMIN_USER / ADMIN_PASSWORD
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "donbeon-admin-secret-jprimo";
const COOKIE = "admin_session";
// 1차 고정 계정 (환경변수로 덮어쓸 수 있음)
const ADMIN_USER = process.env.ADMIN_USER || "jprimo";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "jprimo0603!!";

function sign(v: string) {
  return crypto.createHmac("sha256", SECRET).update(v).digest("hex");
}

/** 아이디/비밀번호 검증 */
export function checkAdmin(user: string, pw: string): boolean {
  return user.trim() === ADMIN_USER && pw === ADMIN_PASSWORD;
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
