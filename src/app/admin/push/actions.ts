"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { sendPushToSegment, sendTestPush, type PushSegment } from "@/lib/push";

export async function sendPushAction(input: {
  title: string;
  body: string;
  url: string;
  imageUrl: string;
  segment: string;
}) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return { ok: false, message: "제목과 내용을 입력하세요." };

  const segment: PushSegment =
    input.segment === "members" || input.segment === "guests" ? input.segment : "all";

  const res = await sendPushToSegment(
    segment,
    { title, body, url: input.url.trim() || undefined, imageUrl: input.imageUrl.trim() || undefined },
    "manual"
  );
  revalidatePath("/admin/push");

  const note =
    res.provider === "mock"
      ? " · ⚠️ Firebase 키 미설정이라 실제 발송은 안 됐어요(대상만 집계). 키 설정 후 재발송하세요."
      : "";
  return { ok: true, message: `발송 처리: 대상 ${res.target} · 성공 ${res.sent} · 실패 ${res.failed}${note}` };
}

/** 테스트 발송 — 특정 기기 토큰 1개에만 */
export async function sendTestPushAction(input: {
  token: string;
  title: string;
  body: string;
  url: string;
  imageUrl: string;
}) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const token = input.token.trim();
  if (!token) return { ok: false, message: "테스트 기기 토큰을 입력하세요." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return { ok: false, message: "제목과 내용을 입력하세요." };

  const res = await sendTestPush(token, {
    title,
    body,
    url: input.url.trim() || undefined,
    imageUrl: input.imageUrl.trim() || undefined,
  });
  revalidatePath("/admin/push");

  if (res.provider === "mock")
    return { ok: false, message: "⚠️ Firebase 키가 없어 실제 발송 불가. 먼저 환경변수를 설정하세요." };
  return res.sent > 0
    ? { ok: true, message: "✅ 테스트 발송 성공! 기기 알림을 확인하세요." }
    : { ok: false, message: "발송 실패 — 토큰이 유효한지 확인하세요." };
}
