// 실명(본인)인증 어댑터
// - mock: 이름+전화만으로 통과 처리(개발/화면 검증용)
// - portone: 포트원 V2 본인인증. 프론트에서 팝업으로 인증 후 받은 identityVerificationId를
//            서버가 포트원 REST API로 조회해 실명·전화·CI를 확정한다.
// ⚠️ portone 실동작 조건: 콘솔에 본인인증 "채널" 연결 + 환경변수
//    (NEXT_PUBLIC_PORTONE_STORE_ID, NEXT_PUBLIC_PORTONE_CHANNEL_KEY, PORTONE_API_SECRET)

export interface IdentityResult {
  ok: boolean;
  name: string;
  phone: string;
  ci?: string; // 본인확인 연계정보
  message?: string;
}

/**
 * 포트원 V2 본인인증 결과 조회 (서버 전용)
 * 프론트 PortOne.requestIdentityVerification 성공 후 받은 identityVerificationId로 검증한다.
 * 문서: https://developers.portone.io/api/rest-v2/identityVerification
 */
export async function verifyPortoneIdentity(identityVerificationId: string): Promise<IdentityResult> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return { ok: false, name: "", phone: "", message: "PORTONE_API_SECRET 환경변수가 없습니다." };
  const id = String(identityVerificationId || "").trim();
  if (!id) return { ok: false, name: "", phone: "", message: "본인인증 ID가 없습니다." };

  try {
    const res = await fetch(`https://api.portone.io/identity-verifications/${encodeURIComponent(id)}`, {
      headers: { Authorization: `PortOne ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, name: "", phone: "", message: `본인인증 조회 실패 (${res.status}) ${body}`.trim() };
    }
    const data = await res.json();
    if (data?.status !== "VERIFIED") {
      return { ok: false, name: "", phone: "", message: `본인인증이 완료되지 않았습니다 (${data?.status ?? "unknown"}).` };
    }
    const c = data.verifiedCustomer ?? {};
    const phone = String(c.phoneNumber ?? "").replace(/-/g, "");
    const name = String(c.name ?? "");
    if (!name || !phone) return { ok: false, name, phone, message: "본인인증 정보(이름/전화)가 비어 있습니다." };
    return { ok: true, name, phone, ci: c.ci ?? undefined };
  } catch (e) {
    return { ok: false, name: "", phone: "", message: e instanceof Error ? e.message : "본인인증 조회 오류" };
  }
}

export async function verifyIdentity(name: string, phone: string): Promise<IdentityResult> {
  const provider = process.env.IDENTITY_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      if (!name.trim() || !/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ""))) {
        return { ok: false, name, phone, message: "이름과 휴대폰번호를 정확히 입력하세요." };
      }
      return { ok: true, name, phone, ci: "MOCK-CI-" + phone.replace(/-/g, "") };

    // case "nice":  return callNice(name, phone);
    // case "danal": return callDanal(name, phone);
    // case "toss":  return callToss(name, phone);

    default:
      return { ok: false, name, phone, message: `미구현 본인인증 provider: ${provider}` };
  }
}
