"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 앱(Capacitor)에서 푸시 권한 요청 + FCM 토큰 서버 등록.
// 네이티브 푸시 플러그인이 아직 안 붙어있으면(웹 또는 FCM 연동 전) 조용히 무시된다.
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
