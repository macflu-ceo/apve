// 실명(본인)인증 어댑터
// 환경변수 IDENTITY_PROVIDER 로 스위치 (mock | nice | danal | toss)
// ⚠️ 실동작하려면 본인확인기관(NICE·다날 등)과 가맹 계약 + 키가 필요.
//    계약 전에는 mock 이 통과 처리하여 흐름/화면을 검증할 수 있게 한다.

export interface IdentityResult {
  ok: boolean;
  name: string;
  phone: string;
  ci?: string; // 본인확인 연계정보
  message?: string;
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
