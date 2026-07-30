"use client";

// 클라이언트에서 방문/클릭 이벤트를 서버로 보낸다. 실패는 조용히 무시.
export function trackEvent(
  kind: "page" | "product" | "click",
  opts: { path?: string; label?: string; goodsNo?: string } = {}
) {
  try {
    const path = opts.path ?? window.location.pathname;
    if (/^\/(admin|api)/.test(path)) return;
    const payload = JSON.stringify({ path, kind, label: opts.label, goodsNo: opts.goodsNo });
    // keepalive: 페이지 이탈 중에도 전송 보장
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

/** 기기별 앱 다운로드 목적지 — 모바일은 해당 스토어, PC는 랜딩 */
export function resolveStoreUrl(u: {
  ios: string | null;
  android: string | null;
  landing: string | null;
}): string | null {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return u.ios || u.landing;
  if (/Android/i.test(ua)) return u.android || u.landing;
  return u.landing || u.ios || u.android; // PC
}
