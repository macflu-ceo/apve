"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, setSession, clearSession, getSessionPartner } from "@/lib/auth";
import { verifyIdentity, verifyPortoneIdentity } from "@/lib/identity";
import { TERMS_VERSION } from "@/lib/terms";
import { getIdentityTicket, clearIdentityTicket, isRaonConfigured } from "@/lib/identity-raon";
import { createGodoAgent } from "@/lib/godomall/agent";

/** 닉네임 설정/변경 — 마이페이지에서 최초 1회만 허용 */
export async function changeNickname(nickname: string) {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, message: "로그인이 필요합니다." };
  if (partner.nicknameChanged) return { ok: false, message: "닉네임은 최초 1회만 변경할 수 있어요." };
  const n = nickname.trim();
  if (n.length < 2 || n.length > 12) return { ok: false, message: "닉네임은 2~12자로 입력하세요." };
  const dup = await prisma.partner.findUnique({ where: { nickname: n }, select: { id: true } });
  if (dup && dup.id !== partner.id) return { ok: false, message: "이미 사용 중인 닉네임입니다." };
  await prisma.partner.update({ where: { id: partner.id }, data: { nickname: n, nicknameChanged: true } });
  revalidatePath("/me");
  revalidatePath("/community");
  return { ok: true, message: "닉네임이 설정되었습니다." };
}

/** 라온 인증결과 티켓 요약 — 모달이 인증완료 상태·실명·전화를 표시할 때 사용 (CI는 안 내려줌) */
export async function getIdentitySummary() {
  const t = getIdentityTicket();
  if (!t) return { verified: false as const };
  return { verified: true as const, name: t.name, phone: t.phone, flow: t.flow };
}

/** 본인인증 — mock 경로 (이름+전화만으로 통과, 개발용) */
export async function requestIdentity(name: string, phone: string) {
  const r = await verifyIdentity(name, phone);
  return { ok: r.ok, ci: r.ci ?? null, message: r.message ?? null };
}

/** 본인인증 확정 — 포트원 팝업 성공 후 identityVerificationId를 서버에서 검증 (실명·전화·CI 수신) */
export async function confirmIdentity(identityVerificationId: string) {
  const r = await verifyPortoneIdentity(identityVerificationId);
  return {
    ok: r.ok,
    ci: r.ci ?? null,
    name: r.name || null,
    phone: r.phone || null,
    message: r.message ?? null,
  };
}

/** 아이디 사용 가능 여부 (가입 2단계 중복확인 버튼) */
export async function checkUsernameAvailable(username: string) {
  const u = username.trim();
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(u))
    return { ok: false, available: false, message: "아이디는 영문/숫자/_ 조합 4~20자입니다." };
  const dup = await prisma.partner.findUnique({ where: { username: u }, select: { id: true } });
  return dup
    ? { ok: true, available: false, message: "이미 사용 중인 아이디입니다." }
    : { ok: true, available: true, message: "사용 가능한 아이디입니다." };
}

/** 판매 코드 자동 생성 — cb + 영숫자 6자 (고도몰은 사전등록 불필요: URL 코드를 그대로 기록) */
async function generatePartnerCode(): Promise<string> {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // 혼동문자(l,1,o,0,i) 제외
  for (let attempt = 0; attempt < 10; attempt++) {
    let c = "cb";
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    const dup = await prisma.partner.findUnique({ where: { code: c }, select: { id: true } });
    if (!dup) return c;
  }
  throw new Error("코드 생성 실패");
}

/** 회원가입 신청 — 본인인증 통과분에 한해 pending 상태로 생성 */
export async function signup(input: {
  username: string;
  password: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  ci: string | null;
  agreeService: boolean;
  agreePrivacy: boolean;
  agreePartnerPolicy: boolean;
  agreeAge14: boolean;
  agreeMarketing: boolean;
}) {
  const username = input.username.trim();
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username))
    return { ok: false, message: "아이디는 영문/숫자/_ 4~20자입니다." };
  if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(input.password))
    return { ok: false, message: "비밀번호는 영문+숫자를 섞어 6자 이상이어야 합니다." };
  if (!input.name.trim() || !input.phone.trim())
    return { ok: false, message: "이름과 휴대폰번호를 입력하세요." };
  const nickname = input.nickname.trim();
  if (!nickname || nickname.length < 2 || nickname.length > 12)
    return { ok: false, message: "닉네임은 2~12자로 입력하세요." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return { ok: false, message: "이메일을 정확히 입력하세요." };
  // 본인인증 확정 — 라온이면 서명 티켓(서버 쿠키)에서 CI를 읽는다 (클라이언트 값 신뢰 안 함)
  let ci = input.ci;
  let realName = input.name.trim();
  let realPhone = input.phone.trim();
  if (isRaonConfigured()) {
    const t = getIdentityTicket();
    if (!t || t.flow !== "signup") return { ok: false, message: "휴대폰 본인인증을 먼저 완료하세요." };
    ci = t.ci;
    realName = t.name || realName;   // 인증기관이 확인한 실명
    realPhone = t.phone || realPhone; // 인증된 전화번호
  }
  if (!ci) return { ok: false, message: "휴대폰 본인인증을 먼저 완료하세요." };
  if (!input.agreeService || !input.agreePrivacy || !input.agreePartnerPolicy || !input.agreeAge14)
    return { ok: false, message: "필수 약관에 모두 동의해야 가입할 수 있습니다." };

  // 1인 1계정 — 같은 CI로 이미 가입돼 있으면 차단
  const dupCi = await prisma.partner.findUnique({ where: { ci }, select: { username: true } });
  if (dupCi)
    return { ok: false, message: "이미 이 명의로 가입된 계정이 있습니다. '아이디 찾기'를 이용해주세요." };

  const dup = await prisma.partner.findUnique({ where: { username } });
  if (dup) return { ok: false, message: "이미 사용 중인 아이디입니다." };
  const dupNick = await prisma.partner.findUnique({ where: { nickname } });
  if (dupNick) return { ok: false, message: "이미 사용 중인 닉네임입니다." };

  const now = new Date();
  const created = await prisma.partner.create({
    data: {
      username,
      passwordHash: hashPassword(input.password),
      name: realName,
      nickname,
      email: input.email.trim(),
      phone: realPhone,
      verified: true,
      ci,
      status: "approved", // 본인인증 완료 = 즉시 승인 (승인제 폐지)
      code: await generatePartnerCode(), // 판매 코드 즉시 자동 발급
      // 가입 직후 자동 로그인되므로 1회로 집계
      lastLoginAt: now,
      loginCount: 1,
      termsAgreedAt: now,
      marketingAgreed: input.agreeMarketing,
      agreementsJson: JSON.stringify({
        version: TERMS_VERSION,
        agreedAt: now.toISOString(),
        service: input.agreeService,
        privacy: input.agreePrivacy,
        partnerPolicy: input.agreePartnerPolicy,
        age14: input.agreeAge14,
        marketing: input.agreeMarketing,
      }),
    },
  });
  clearIdentityTicket(); // 티켓 일회용 소진
  // 고도몰에 영업사원(분류) 회원 자동 등록 — 판매 추적의 전제. 실패해도 가입은 진행(크론이 보정).
  if (created.code) await createGodoAgent(created.code, realName, input.email.trim()).catch(() => {});
  // 가입 즉시 로그인 + 판매 코드까지 자동 발급 — 바로 링크 발급 가능
  setSession(created.id);
  return { ok: true, message: "가입 완료! 바로 판매를 시작할 수 있어요." };
}

/** 로그인 (승인대기 회원도 로그인 가능, 반려/비활성만 차단) */
export async function login(username: string, password: string) {
  const p = await prisma.partner.findUnique({ where: { username: username.trim() } });
  if (!p || !verifyPassword(password, p.passwordHash))
    return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  if (p.status === "rejected" || !p.active) return { ok: false, message: "이용이 제한된 계정입니다." };

  // 로그인 통계 기록 (어드민 회원 관리에서 조회)
  await prisma.partner.update({
    where: { id: p.id },
    data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
  });

  setSession(p.id);
  return { ok: true, message: "로그인되었습니다." };
}

export async function logout() {
  clearSession();
  return { ok: true };
}

/** 아이디 찾기 — 본인인증(티켓)의 CI로 계정 조회 */
export async function findUsernameByIdentity() {
  const t = getIdentityTicket();
  if (!t || t.flow !== "find-id") return { ok: false, message: "본인인증을 먼저 완료해주세요." };
  const p = await prisma.partner.findUnique({
    where: { ci: t.ci },
    select: { username: true, createdAt: true, active: true },
  });
  clearIdentityTicket(); // 일회용
  if (!p) return { ok: false, message: "이 명의로 가입된 계정이 없습니다." };
  if (!p.active) return { ok: false, message: "탈퇴했거나 이용이 제한된 계정입니다. 고객센터로 문의해주세요." };
  const joined = new Date(p.createdAt.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  return { ok: true, username: p.username, joinedAt: joined };
}

/** 비밀번호 재설정 1단계 — 아이디 + 본인인증 CI 일치 확인 (티켓은 유지, 2단계에서 소진) */
export async function verifyResetIdentity(username: string) {
  const t = getIdentityTicket();
  if (!t || t.flow !== "reset-pw") return { ok: false, message: "본인인증을 먼저 완료해주세요." };
  const u = username.trim();
  if (!u) return { ok: false, message: "아이디를 입력하세요." };
  const p = await prisma.partner.findUnique({ where: { username: u }, select: { ci: true, active: true } });
  if (!p) return { ok: false, message: "존재하지 않는 아이디입니다." };
  if (!p.active) return { ok: false, message: "탈퇴했거나 이용이 제한된 계정입니다." };
  if (!p.ci || p.ci !== t.ci)
    return { ok: false, message: "본인인증 정보와 계정 명의가 일치하지 않습니다." };
  return { ok: true };
}

/** 비밀번호 재설정 2단계 — 새 비밀번호 저장 (티켓 소진) */
export async function resetPasswordByIdentity(username: string, newPassword: string) {
  const t = getIdentityTicket();
  if (!t || t.flow !== "reset-pw") return { ok: false, message: "본인인증이 만료되었습니다. 처음부터 다시 진행해주세요." };
  if (newPassword.length < 6) return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  const u = username.trim();
  const p = await prisma.partner.findUnique({ where: { username: u }, select: { id: true, ci: true, active: true } });
  if (!p || !p.active || !p.ci || p.ci !== t.ci)
    return { ok: false, message: "본인인증 정보와 계정 명의가 일치하지 않습니다." };
  await prisma.partner.update({ where: { id: p.id }, data: { passwordHash: hashPassword(newPassword) } });
  clearIdentityTicket();
  return { ok: true, message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요." };
}

/** 본인인증 티켓 폐기 — 가입창을 닫으면 처음부터 다시 인증하도록 */
export async function discardIdentityTicket() {
  clearIdentityTicket();
  return { ok: true };
}
