// 유입 플랫폼 판별 (서버 전용) — 웹뷰 래퍼는 커스텀 UA 또는 ?platform=app 쿠키로 식별.
//  · 앱(웹뷰): Capacitor/WKWebView가 UA에 "CashBoutiqueApp" 를 붙이도록 설정 → 서버가 감지
//  · 폴백: 최초 진입 시 ?platform=app 이면 미들웨어가 쿠키를 심음
import { headers, cookies } from "next/headers";

export type Platform = "app" | "web";

/** 앱 웹뷰 UA 마커 (래퍼에서 appendUserAgent 로 설정) */
export const APP_UA_MARKER = "CashBoutiqueApp";

export function getPlatform(): Platform {
  try {
    const ua = headers().get("user-agent") ?? "";
    if (ua.includes(APP_UA_MARKER)) return "app";
    if (cookies().get("platform")?.value === "app") return "app";
  } catch {
    /* headers/cookies 사용 불가 컨텍스트 */
  }
  return "web";
}
