"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 앱(Capacitor)에서 푸시 권한 요청 + FCM 토큰 서버 등록.
// 네이티브 푸시 플러그인이 아직 안 붙어있으면(웹 또는 FCM 연동 전) 조용히 무시된다.
/** 푸시 알림 탭 → data.url 로 이동 (딥링크). 앱 실행 시 1회 등록.
 *  콜드스타트(알림 탭으로 앱 시작)도 리스너 등록 직후 이벤트가 도착해 처리된다. */
export async function bindPushTapNavigation(): Promise<void> {
  try {
    const Cap = (window as any).Capacitor;
    const Push = Cap?.Plugins?.PushNotifications;
    if (!Push) return;
    Push.addListener?.("pushNotificationActionPerformed", (action: any) => {
      const url = action?.notification?.data?.url;
      if (typeof url !== "string" || !url) return;
      try {
        if (url.startsWith("/")) {
          window.location.href = url; // 내부 경로
        } else {
          const dest = new URL(url);
          // 우리 도메인만 허용 (외부 링크 주입 방지)
          if (dest.origin === window.location.origin) window.location.href = dest.pathname + dest.search;
        }
      } catch {
        /* 잘못된 URL 무시 */
      }
    });
  } catch {
    /* noop */
  }
}

export async function requestAppPushPermission(): Promise<void> {
  try {
    const Cap = (window as any).Capacitor;
    const Push = Cap?.Plugins?.PushNotifications;
    if (!Push) return; // 플러그인 미탑재 → 무시 (FCM 연동 후 자동 작동)

    // 토큰 수신 → 서버 등록
    Push.addListener?.("registration", (token: any) => {
      fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token?.value, platform: Cap.getPlatform?.() ?? "android" }),
        keepalive: true,
      }).catch(() => {});
    });

    const perm = await Push.requestPermissions?.();
    if (perm?.receive === "granted") await Push.register?.();
  } catch {
    /* noop */
  }
}
