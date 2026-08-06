// 텔레그램 발송 (MD 데일리 리포트/이상징후용) — 고객 CRM과 별개, 운영자 알림 채널
// 필요 env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { ok: false, error: "TELEGRAM_BOT_TOKEN/CHAT_ID 미설정" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const d = await res.json().catch(() => ({}));
    return res.ok && d?.ok ? { ok: true } : { ok: false, error: d?.description || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** 봇에게 온 메시지에서 chat_id 조회 (최초 세팅용) */
export async function getTelegramChatId(): Promise<string[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return [];
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const d = await res.json().catch(() => ({}));
  const ids = new Set<string>();
  for (const u of d?.result ?? []) {
    const c = u?.message?.chat?.id ?? u?.channel_post?.chat?.id;
    if (c != null) ids.add(String(c));
  }
  return [...ids];
}
