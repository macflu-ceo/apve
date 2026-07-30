"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { sendPushToSegment, type PushSegment } from "@/lib/push";

export async function sendPushAction(input: { title: string; body: string; url: string; segment: string }) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return { ok: false, message: "제목과 내용을 입력하세요." };

  const segment: PushSegment =
    input.segment === "members" || input.segment === "guests" ? input.segment : "all";

  const res = await sendPushToSegment(segment, { title, body, url: input.url.trim() || undefined }, "manual");
  revalidatePath("/admin/push");

  const note =
    res.provider === "mock"
      ? " · ⚠️ Firebase 키 미설정이라 실제 발송은 안 됐어요(대상만 집계). 키 설정 후 재발송하세요."
      : "";
  return { ok: true, message: `발송 처리: 대상 ${res.target} · 성공 ${res.sent} · 실패 ${res.failed}${note}` };
}
