// 카카오 로그인 — 토큰 교환 · 사용자 조회 · 가입/로그인 처리
// 동의항목 심사 전에는 이름·전화번호가 안 내려올 수 있으므로, 있는 정보만으로 가입하고
// 심사 통과 후 로그인부터는 받은 값으로 빈칸을 채운다.
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { createGodoAgent } from "@/lib/godomall/agent";
import { alertSignup } from "@/lib/report/alerts";
import { TERMS_VERSION } from "@/lib/terms";

const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const ME_URL = "https://kapi.kakao.com/v2/user/me";

export type KakaoProfile = {
  kakaoId: string;
  name: string | null; // 실명 (동의항목 심사 후)
  nickname: string | null; // 프로필 닉네임
  phone: string | null; // 010… 로 정규화
  birthyear: string | null; // "1990"
  birthday: string | null; // "0304" (MMDD)
  gender: string | null; // male | female
};

/** +82 10-1234-5678 → 01012345678 */
function normalizePhone(v: string | null | undefined): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  if (digits.startsWith("82")) return "0" + digits.slice(2);
  return digits || null;
}

export async function exchangeAndFetchProfile(code: string): Promise<KakaoProfile> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: process.env.KAKAO_REDIRECT_URI ?? "",
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
    cache: "no-store",
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(`카카오 토큰 발급 실패: ${token.error_description ?? token.error ?? tokenRes.status}`);
  }

  const meRes = await fetch(ME_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const me = await meRes.json();
  if (!meRes.ok || !me.id) throw new Error("카카오 사용자 조회 실패");

  const acc = me.kakao_account ?? {};
  return {
    kakaoId: String(me.id),
    name: acc.name ?? null,
    nickname: acc.profile?.nickname ?? null,
    phone: normalizePhone(acc.phone_number),
    birthyear: acc.birthyear ?? null,
    birthday: acc.birthday ?? null,
    gender: acc.gender ?? null,
  };
}

/** 판매 코드 자동 생성 — cb + 영숫자 6자 (auth-actions와 동일 규칙) */
async function generatePartnerCode(): Promise<string> {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let c = "cb";
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    const dup = await prisma.partner.findUnique({ where: { code: c }, select: { id: true } });
    if (!dup) return c;
  }
  throw new Error("코드 생성 실패");
}

/** 카카오 프로필로 로그인(기존) 또는 가입(신규). 성공 시 세션까지 설정 */
export async function kakaoSignInOrUp(p: KakaoProfile): Promise<{ ok: true; created: boolean } | { ok: false; reason: "age" | "blocked" }> {
  // 만 14세 미만 차단 (출생연도가 내려오는 경우에만 판별 가능)
  if (p.birthyear) {
    const age = new Date().getFullYear() - Number(p.birthyear);
    if (age < 14) return { ok: false, reason: "age" };
  }

  const existing = await prisma.partner.findUnique({ where: { kakaoId: p.kakaoId } });
  if (existing) {
    if (existing.status === "rejected" || !existing.active) return { ok: false, reason: "blocked" };
    await prisma.partner.update({
      where: { id: existing.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        // 심사 통과 후 처음 받은 실명·전화번호로 빈칸 보완
        ...(p.name && (existing.name === existing.username || !existing.verified) ? { name: p.name, verified: true } : {}),
        ...(p.phone && !existing.phone ? { phone: p.phone } : {}),
      },
    });
    setSession(existing.id);
    return { ok: true, created: false };
  }

  const now = new Date();
  const name = p.name ?? p.nickname ?? "카카오회원";
  const username = `kakao_${p.kakaoId}`.slice(0, 30);
  const created = await prisma.partner.create({
    data: {
      username,
      passwordHash: "!kakao", // 카카오 전용 계정 — 비밀번호 로그인 불가 값
      name,
      phone: p.phone,
      verified: !!(p.name && p.phone), // 실명·전화까지 받았으면 확인된 것으로
      kakaoId: p.kakaoId,
      status: "approved",
      code: await generatePartnerCode(),
      lastLoginAt: now,
      loginCount: 1,
      termsAgreedAt: now,
      agreementsJson: JSON.stringify({
        version: TERMS_VERSION,
        agreedAt: now.toISOString(),
        via: "kakao_sync", // 카카오 간편가입 동의창에서 약관 동의
        service: true,
        privacy: true,
        age14: true,
      }),
    },
  });
  if (created.code) await createGodoAgent(created.code, name, "").catch(() => {});
  await alertSignup({ name, username, code: created.code }).catch(() => {});
  setSession(created.id);
  return { ok: true, created: true };
}
