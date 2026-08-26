// 앱 푸시 발송 (FCM HTTP v1) — 서버 전용.
// Firebase 서비스계정 환경변수(FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)가 있으면 실제 발송,
// 없으면 mock(대상 집계만). 앱이 아직 없거나 키 미설정이어도 어드민 UI·현황은 동작한다.
import crypto from "crypto";
import { prisma } from "@/lib/db";

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function creds(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, "\n"); // env에 이스케이프된 개행 복원
  return { projectId, clientEmail, privateKey };
}

/** Firebase 키가 설정되어 실제 발송 가능한지 */
export function isPushConfigured(): boolean {
  return creds() !== null;
}

async function getAccessToken(c: { clientEmail: string; privateKey: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({ iss: c.clientEmail, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
  );
  const unsigned = `${header}.${claim}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(unsigned), c.privateKey);
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

export interface PushResult {
  provider: string;
  sent: number;
  failed: number;
  target: number;
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  imageUrl?: string;
}

/** 알림 이미지 자동 축소 — 안드로이드는 1MB 초과 이미지를 조용히 버리므로,
 * 사이트의 이미지 최적화(/_next/image)를 거친 축소본 URL로 바꿔 싣는다. */
function notificationImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const site = (process.env.SITE_URL || "https://www.cashboutique.co.kr").replace(/\/$/, "");
  try {
    const u = new URL(url);
    // 이미 최적화 URL이면 그대로
    if (u.pathname.startsWith("/_next/image")) return url;
    return `${site}/_next/image?url=${encodeURIComponent(url)}&w=828&q=70`;
  } catch {
    return url;
  }
}

/** 알림 링크에 pushId를 심어 열람(탭) 귀속. url이 없으면 홈(/)으로. 상대/절대 모두 처리. */
function withPushId(url: string | undefined, pushId: string): string {
  const base = url && url.trim() ? url.trim() : "/";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}pushId=${pushId}`;
}

/** 지정 토큰들에 발송. 무효 토큰(404/400)은 비활성 처리. */
export async function sendPushToTokens(
  tokens: { id: string; token: string }[],
  msg: PushMessage
): Promise<PushResult> {
  const target = tokens.length;
  const c = creds();
  if (!c) return { provider: "mock", sent: 0, failed: 0, target };
  if (target === 0) return { provider: "fcm", sent: 0, failed: 0, target };

  let access: string;
  try {
    access = await getAccessToken(c);
  } catch {
    return { provider: "fcm", sent: 0, failed: target, target };
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${c.projectId}/messages:send`;
  let sent = 0;
  let failed = 0;
  const dead: string[] = [];

  const chunk = 10; // 동시 발송 제한
  for (let i = 0; i < tokens.length; i += chunk) {
    const slice = tokens.slice(i, i + chunk);
    const results = await Promise.allSettled(
      slice.map(async (t) => {
        const img = notificationImage(msg.imageUrl); // 1MB 초과 방지 축소본
        const payload = {
          message: {
            token: t.token,
            notification: {
              title: msg.title,
              body: msg.body,
              ...(img ? { image: img } : {}),
            },
            // 안드로이드 BigPicture · iOS 리치 알림(이미지)
            ...(img
              ? {
                  android: { notification: { image: img } },
                  apns: {
                    payload: { aps: { "mutable-content": 1 } },
                    fcm_options: { image: img },
                  },
                }
              : {}),
            ...(msg.url ? { data: { url: msg.url }, webpush: { fcmOptions: { link: msg.url } } } : {}),
          },
        };
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) return "ok";
        if (r.status === 404 || r.status === 400) dead.push(t.id); // 만료/무효 토큰
        throw new Error(`fcm ${r.status}`);
      })
    );
    for (const x of results) x.status === "fulfilled" ? sent++ : failed++;
  }

  if (dead.length) {
    await prisma.pushToken.updateMany({ where: { id: { in: dead } }, data: { active: false } }).catch(() => {});
  }
  return { provider: "fcm", sent, failed, target };
}

export type PushSegment = "all" | "members" | "guests";

/** 세그먼트로 발송하고 이력(PushLog)까지 남긴다. 어드민·트리거 공용 진입점. */
export async function sendPushToSegment(
  segment: PushSegment,
  msg: PushMessage,
  trigger = "manual"
): Promise<PushResult> {
  const where: { active: boolean; partnerId?: { not: null } | null } = { active: true };
  if (segment === "members") where.partnerId = { not: null };
  if (segment === "guests") where.partnerId = null;

  const tokens = await prisma.pushToken.findMany({ where, select: { id: true, token: true } });
  return dispatch(tokens, msg, segment, trigger);
}

/** 공용 발송 — 로그 먼저 만들어 pushId(열람 귀속) 심고 전송 후 결과 반영 */
async function dispatch(
  tokens: { id: string; token: string }[],
  msg: PushMessage,
  segment: string,
  trigger: string
): Promise<PushResult> {
  const log = await prisma.pushLog.create({
    data: { title: msg.title, body: msg.body, url: msg.url ?? null, imageUrl: msg.imageUrl ?? null, segment, trigger, target: 0, sent: 0, failed: 0, provider: "mock" },
  });
  const linkUrl = withPushId(msg.url, log.id);
  const res = await sendPushToTokens(tokens, { ...msg, url: linkUrl });
  await prisma.pushLog.update({
    where: { id: log.id },
    data: { target: res.target, sent: res.sent, failed: res.failed, provider: res.provider },
  });
  return res;
}

/** 특정 회원 등급에게만 발송 (예: '매장' 등급 → 예약 알림, '관리자' 등급 → 관리 메시지) */
export async function sendPushToGrade(gradeId: string, gradeName: string, msg: PushMessage, trigger = "manual"): Promise<PushResult> {
  const partners = await prisma.partner.findMany({ where: { gradeId, active: true }, select: { id: true } });
  const ids = partners.map((p) => p.id);
  const tokens = ids.length
    ? await prisma.pushToken.findMany({ where: { active: true, partnerId: { in: ids } }, select: { id: true, token: true } })
    : [];
  return dispatch(tokens, msg, `등급:${gradeName}`, trigger);
}

/** 등급 이름으로 발송 (없으면 무시). 트리거·서버 내부용. */
export async function sendPushToGradeName(gradeName: string, msg: PushMessage, trigger = "manual"): Promise<PushResult | null> {
  const grade = await prisma.grade.findUnique({ where: { name: gradeName }, select: { id: true, name: true } });
  if (!grade) return null;
  return sendPushToGrade(grade.id, grade.name, msg, trigger);
}

/** 테스트 수신자(pushTester) 회원 기기 전체에 발송 — 등급과 무관. */
export async function sendPushToTesters(msg: PushMessage): Promise<PushResult> {
  const testers = await prisma.partner.findMany({ where: { pushTester: true }, select: { id: true } });
  const tokens = await prisma.pushToken.findMany({
    where: { active: true, partnerId: { in: testers.map((t) => t.id) } },
    select: { id: true, token: true },
  });
  const res = await sendPushToTokens(tokens, msg);
  await prisma.pushLog.create({
    data: {
      title: msg.title,
      body: msg.body,
      url: msg.url ?? null,
      imageUrl: msg.imageUrl ?? null,
      segment: "tester",
      trigger: "test",
      target: res.target,
      sent: res.sent,
      failed: res.failed,
      provider: res.provider,
    },
  });
  return res;
}

/** 특정 회원의 기기들에 발송 (개별 로그는 남기지 않음 — 트리거에서 집계). */
export async function sendPushToPartner(partnerId: string, msg: PushMessage): Promise<PushResult> {
  const tokens = await prisma.pushToken.findMany({
    where: { active: true, partnerId },
    select: { id: true, token: true },
  });
  return sendPushToTokens(tokens, msg);
}

/** 테스트 발송 — 특정 기기 토큰 1개에만. (운영자가 본인 기기로 미리 확인) */
export async function sendTestPush(token: string, msg: PushMessage): Promise<PushResult> {
  const res = await sendPushToTokens([{ id: "test", token }], msg);
  await prisma.pushLog.create({
    data: {
      title: msg.title,
      body: msg.body,
      url: msg.url ?? null,
      imageUrl: msg.imageUrl ?? null,
      segment: "test",
      trigger: "test",
      target: res.target,
      sent: res.sent,
      failed: res.failed,
      provider: res.provider,
    },
  });
  return res;
}
