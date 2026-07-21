"use server";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, setSession, clearSession } from "@/lib/auth";
import { verifyIdentity } from "@/lib/identity";

/** 본인인증 (모달의 '본인인증' 버튼) */
export async function requestIdentity(name: string, phone: string) {
  const r = await verifyIdentity(name, phone);
  return { ok: r.ok, ci: r.ci ?? null, message: r.message ?? null };
}

/** 회원가입 신청 — 본인인증 통과분에 한해 pending 상태로 생성 */
export async function signup(input: {
  username: string;
  password: string;
  name: string;
  phone: string;
  ci: string | null;
}) {
  const username = input.username.trim();
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username))
    return { ok: false, message: "아이디는 영문/숫자/_ 4~20자입니다." };
  if (input.password.length < 6) return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  if (!input.name.trim() || !input.phone.trim())
    return { ok: false, message: "이름과 휴대폰번호를 입력하세요." };
  if (!input.ci) return { ok: false, message: "본인인증을 먼저 완료하세요." };

  const dup = await prisma.partner.findUnique({ where: { username } });
  if (dup) return { ok: false, message: "이미 사용 중인 아이디입니다." };

  const created = await prisma.partner.create({
    data: {
      username,
      passwordHash: hashPassword(input.password),
      name: input.name.trim(),
      phone: input.phone.trim(),
      verified: true,
      ci: input.ci,
      status: "pending",
    },
  });
  // 가입 즉시 로그인 (상태는 승인대기중)
  setSession(created.id);
  return { ok: true, message: "가입 완료! 지금은 승인대기중이며, 승인되면 코드가 발급됩니다." };
}

/** 로그인 (승인대기 회원도 로그인 가능, 반려/비활성만 차단) */
export async function login(username: string, password: string) {
  const p = await prisma.partner.findUnique({ where: { username: username.trim() } });
  if (!p || !verifyPassword(password, p.passwordHash))
    return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  if (p.status === "rejected" || !p.active) return { ok: false, message: "이용이 제한된 계정입니다." };

  setSession(p.id);
  return { ok: true, message: "로그인되었습니다." };
}

export async function logout() {
  clearSession();
  return { ok: true };
}
