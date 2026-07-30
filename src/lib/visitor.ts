// 방문자 식별 (서버 전용) — 익명 쿠키 기반. 개인정보가 아닌 랜덤 ID만 저장.
import { cookies } from "next/headers";
import crypto from "crypto";

const VID = "vid"; // 장기 방문자 식별 (리텐션)
const VSID = "vsid"; // 세션 식별 (30분 무활동 시 새 세션 → 방문횟수)
const SESSION_MIN = 30;

/** KST 기준 오늘 날짜 YYYY-MM-DD */
export function kstDay(d: Date = new Date()): string {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 방문자 ID 읽기(없으면 새로 발급하고 쿠키 세팅). 반환: {visitorId, isNew} */
export function getOrSetVisitorId(): { visitorId: string; isNew: boolean } {
  const jar = cookies();
  const cur = jar.get(VID)?.value;
  if (cur) return { visitorId: cur, isNew: false };
  const visitorId = crypto.randomUUID();
  jar.set(VID, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1년
  });
  return { visitorId, isNew: true };
}

/**
 * 세션 ID 읽기/갱신. 쿠키에 "id.만료ms" 저장, 30분 슬라이딩.
 * 만료됐으면 새 세션 시작(→ 방문 횟수 +1로 카운트됨).
 */
export function getOrSetSessionId(): { sessionId: string; isNewSession: boolean } {
  const jar = cookies();
  const raw = jar.get(VSID)?.value;
  const now = Date.now();
  let sessionId = "";
  let isNewSession = true;
  if (raw) {
    const [id, exp] = raw.split(".");
    if (id && exp && Number(exp) > now) {
      sessionId = id;
      isNewSession = false;
    }
  }
  if (!sessionId) sessionId = crypto.randomUUID();
  const expiry = now + SESSION_MIN * 60_000;
  jar.set(VSID, `${sessionId}.${expiry}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 쿠키 자체는 하루 유지(내부 만료로 세션 판정)
  });
  return { sessionId, isNewSession };
}
