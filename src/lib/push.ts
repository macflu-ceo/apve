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
        const payload = {
          message: {
            token: t.token,
            notification: {
              title: msg.title,
              body: msg.body,
              ...(msg.imageUrl ? { image: msg.imageUrl } : {}),
            },
            // 안드로이드 BigPicture · iOS 리치 알림(이미지)
            ...(msg.imageUrl
              ? {
                  android: { notification: { image: msg.imageUrl } },
                  apns: {
                    payload: { aps: { "mutable-content": 1 } },
                    fcm_options: { image: msg.imageUrl },
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
  const res = await sendPushToTokens(tokens, msg);
  await prisma.pushLog.create({
    data: {
      title: msg.title,
      body: msg.body,
      url: msg.url ?? null,
      imageUrl: msg.imageUrl ?? null,
      segment,
      trigger,
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
