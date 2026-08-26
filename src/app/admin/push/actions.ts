"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { sendPushToSegment, sendPushToGrade, sendPushToGradeName, sendPushToTesters, type PushSegment } from "@/lib/push";

export async function sendPushAction(input: {
  title: string;
  body: string;
  url: string;
  imageUrl: string;
  segment: string;
  gradeId?: string; // segment==="grade" 일 때
}) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return { ok: false, message: "제목과 내용을 입력하세요." };

  const msg = { title, body, url: input.url.trim() || undefined, imageUrl: input.imageUrl.trim() || undefined };

  let res;
  if (input.segment === "grade") {
    if (!input.gradeId) return { ok: false, message: "등급을 선택하세요." };
    const grade = await prisma.grade.findUnique({ where: { id: input.gradeId }, select: { id: true, name: true } });
    if (!grade) return { ok: false, message: "등급을 찾을 수 없습니다." };
    res = await sendPushToGrade(grade.id, grade.name, msg, "manual");
  } else {
    const segment: PushSegment = input.segment === "members" || input.segment === "guests" ? input.segment : "all";
    res = await sendPushToSegment(segment, msg, "manual");
  }
  revalidatePath("/admin/push");

  const note =
    res.provider === "mock"
      ? " · ⚠️ Firebase 키 미설정이라 실제 발송은 안 됐어요(대상만 집계). 키 설정 후 재발송하세요."
      : "";
  return { ok: true, message: `발송 처리: 대상 ${res.target} · 성공 ${res.sent} · 실패 ${res.failed}${note}` };
}

/** 테스트 발송 — '테스트 수신자'로 지정된 회원 기기에만 (토큰 입력 불필요) */
export async function sendTestPushAction(input: {
  title: string;
  body: string;
  url: string;
  imageUrl: string;
}) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return { ok: false, message: "제목과 내용을 입력하세요." };

  const res = await sendPushToTesters({
    title,
    body,
    url: input.url.trim() || undefined,
    imageUrl: input.imageUrl.trim() || undefined,
  });
  revalidatePath("/admin/push");

  if (res.provider === "mock")
    return { ok: false, message: "⚠️ Firebase 키가 없어 실제 발송 불가. 먼저 환경변수를 설정하세요." };
  if (res.target === 0)
    return { ok: false, message: "테스트 수신자 중 앱 설치·알림 동의한 기기가 없어요. 아래에서 본인 계정을 테스트 수신자로 지정하고 앱에서 알림 동의하면 여기로 테스트가 갑니다." };
  return res.sent > 0
    ? { ok: true, message: `✅ 테스트 수신자 기기로 발송! (성공 ${res.sent} · 실패 ${res.failed})` }
    : { ok: false, message: "발송 실패 — 기기 토큰이 만료됐을 수 있어요." };
}

/** 테스트 수신자 지정/해제 — 아이디로 지정, 등급과 무관 */
export async function setPushTesterAction(username: string, on: boolean) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const u = username.trim();
  if (!u) return { ok: false, message: "아이디를 입력하세요." };
  const partner = await prisma.partner.findUnique({ where: { username: u }, select: { id: true, name: true } });
  if (!partner) return { ok: false, message: `'${u}' 회원을 찾을 수 없습니다.` };
  await prisma.partner.update({ where: { id: partner.id }, data: { pushTester: on } });
  revalidatePath("/admin/push");
  return { ok: true, message: on ? `${partner.name}(${u}) 님을 테스트 수신자로 지정했어요.` : `${partner.name}(${u}) 님을 테스트 수신자에서 해제했어요.` };
}

/** 예약 발송 등록 — sendAt(KST 'YYYY-MM-DDTHH:mm')에 크론이 발송 */
export async function schedulePushAction(input: {
  title: string;
  body: string;
  url: string;
  imageUrl: string;
  segment: string;
  sendAt: string;
}) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return { ok: false, message: "제목과 내용을 입력하세요." };
  if (!input.sendAt) return { ok: false, message: "예약 시각을 선택하세요." };

  const when = new Date(`${input.sendAt}:00+09:00`); // datetime-local(KST) → Date
  if (Number.isNaN(when.getTime())) return { ok: false, message: "시각 형식이 올바르지 않습니다." };
  if (when.getTime() < Date.now() - 60_000) return { ok: false, message: "지난 시각으로는 예약할 수 없습니다." };

  const segment: PushSegment =
    input.segment === "members" || input.segment === "guests" ? input.segment : "all";

  await prisma.scheduledPush.create({
    data: {
      title,
      body,
      url: input.url.trim() || null,
      imageUrl: input.imageUrl.trim() || null,
      segment,
      sendAt: when,
    },
  });
  revalidatePath("/admin/push");
  return { ok: true, message: "예약되었습니다." };
}

export async function cancelScheduledPush(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.scheduledPush.update({ where: { id }, data: { status: "canceled" } });
  revalidatePath("/admin/push");
  return { ok: true, message: "취소되었습니다." };
}
