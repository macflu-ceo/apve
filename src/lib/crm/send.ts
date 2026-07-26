// 메시지 발송 어댑터
// 실제 발송은 카카오 비즈메시지 발송대행사(솔라피·알리고·비즈고 등) API를 통해 이뤄진다.
// 계약·발신프로필·인증키가 준비되기 전에는 mock 으로 흐름만 검증한다.
//   환경변수 CRM_PROVIDER = mock | solapi | ...
//   CRM_SENDER_KEY(발신프로필 키), CRM_API_KEY/SECRET 등은 provider별로 사용.

export type MessageChannel = "friendtalk" | "alimtalk" | "sms";

export interface SendTarget {
  phone: string | null;
  name: string;
  channelFriend: boolean;
}

export interface SendPayload {
  channel: MessageChannel;
  content: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  /** 알림톡 템플릿 코드 (alimtalk 필수) */
  templateCode?: string | null;
}

export interface SendResult {
  requested: number;
  sent: number;
  skipped: number;
  provider: string;
  message: string;
}

const PROVIDER = process.env.CRM_PROVIDER ?? "mock";

/** 채널별 발송 가능 대상만 남긴다. */
export function eligible(targets: SendTarget[], channel: MessageChannel): SendTarget[] {
  return targets.filter((t) => {
    if (!t.phone) return false;
    if (channel === "friendtalk") return t.channelFriend; // 친구톡은 채널 친구만
    return true; // 알림톡·문자는 번호만 있으면 가능
  });
}

/**
 * 메시지를 발송한다. (현재 mock — 실제 발송은 provider 연결 후)
 */
export async function sendMessage(payload: SendPayload, targets: SendTarget[]): Promise<SendResult> {
  const ok = eligible(targets, payload.channel);
  const skipped = targets.length - ok.length;

  if (PROVIDER === "mock") {
    return {
      requested: targets.length,
      sent: ok.length,
      skipped,
      provider: "mock",
      message: `mock 발송: ${ok.length}건 (대상 부적합 ${skipped}건 제외) — 실제 발송은 발송대행사 연결 후`,
    };
  }

  // TODO: provider === "solapi" 등 실제 발송 연동
  //  - 알림톡: templateCode + 승인된 템플릿 변수
  //  - 친구톡: 이미지/링크 포함, 채널 친구 대상
  //  - 실패 건 재시도/로그
  return {
    requested: targets.length,
    sent: 0,
    skipped,
    provider: PROVIDER,
    message: `미구현 provider: ${PROVIDER}`,
  };
}
