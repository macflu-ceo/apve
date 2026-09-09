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

const LOADING_ID = "kakao-loading-overlay";

/** 버튼을 누른 순간부터 카카오톡 전환·토큰 처리 동안 보이는 로딩 오버레이 */
function showLoading() {
  if (document.getElementById(LOADING_ID)) return;
  const el = document.createElement("div");
  el.id = LOADING_ID;
  el.setAttribute("role", "status");
  el.style.cssText =
    "position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(255,255,255,.88);backdrop-filter:blur(2px)";
  el.innerHTML =
    '<style>@keyframes kk-spin{to{transform:rotate(360deg)}}</style>' +
    '<div style="width:44px;height:44px;border-radius:50%;border:4px solid #F5E27A;border-top-color:#191919;animation:kk-spin .8s linear infinite"></div>' +
    '<div style="font-size:14px;font-weight:700;color:#191919">카카오 로그인 중…</div>' +
    '<div style="font-size:12px;color:#8b95a1">카카오톡이 열리면 동의 후 돌아와 주세요</div>';
  document.body.appendChild(el);
  // 뒤로가기(bfcache)로 돌아왔을 때 오버레이가 남지 않게
  window.addEventListener("pageshow", hideLoading, { once: true });
}
function hideLoading() {
  document.getElementById(LOADING_ID)?.remove();
}

/** 카카오 로그인/가입 시작. 네이티브가 가능하면 카카오톡 앱으로, 아니면 웹 OAuth로 이동 */
export async function startKakao(): Promise<void> {
  showLoading();
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
  } catch (e) {
    // 카카오톡 미설치·취소 등 → 웹 OAuth 폴백.
    // 실기기 원인 추적을 위해 에러 내용을 잠시 보여준다 (사용자 취소는 제외)
    const msg = e instanceof Error ? e.message : String(e);
    hideLoading();
    if (/cancel|취소/i.test(msg)) {
      // 사용자가 카카오톡에서 취소 → 원래 화면 유지
      return;
    }
    alert("카카오톡 로그인 오류: " + msg.slice(0, 300));
    showLoading();
    window.location.href = "/auth/kakao/start";
  }
}
