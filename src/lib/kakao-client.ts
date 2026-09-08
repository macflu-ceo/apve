"use client";

// 카카오 로그인 시작 — 앱(웹뷰)이면 네이티브 카카오톡 로그인, 아니면 웹 OAuth로.
// 앱에서는 카카오톡이 바로 열려 아이디·비밀번호 입력이 없다.

type KakaoPlugin = { goLogin(): Promise<{ accessToken: string }> };

function nativePlugin(): KakaoPlugin | null {
  try {
    const w = window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { KakaoLoginPlugin?: KakaoPlugin } };
    };
    if (w.Capacitor?.isNativePlatform?.() && w.Capacitor.Plugins?.KakaoLoginPlugin) {
      return w.Capacitor.Plugins.KakaoLoginPlugin;
    }
  } catch {
    /* noop */
  }
  return null;
}

/** 카카오 로그인/가입 시작. 네이티브가 가능하면 카카오톡 앱으로, 아니면 웹 OAuth로 이동 */
export async function startKakao(): Promise<void> {
  const plugin = nativePlugin();
  if (!plugin) {
    window.location.href = "/auth/kakao/start";
    return;
  }
  try {
    const r = await plugin.goLogin();
    const res = await fetch("/api/auth/kakao/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: r.accessToken }),
    });
    const j = await res.json();
    if (j.ok) {
      window.location.href = j.created ? "/?welcome=1" : "/";
    } else {
      window.location.href = `/signup?kakao=${j.reason ?? "error"}`;
    }
  } catch {
    // 카카오톡 미설치·취소 등 → 웹 OAuth 폴백
    window.location.href = "/auth/kakao/start";
  }
}
