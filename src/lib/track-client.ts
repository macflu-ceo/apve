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
