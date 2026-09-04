"use client";

// 앱(웹뷰) 전용 — 백그라운드에 오래 있던 화면을 다시 열면 자동 새로고침.
// 웹뷰는 페이지를 며칠씩 유지해서, 그 사이 품절 처리(active=false)된 상품이
// 앱에만 남아 보이는 문제를 막는다.
import { useEffect } from "react";

const STALE_MS = 10 * 60 * 1000; // 10분 이상 백그라운드였으면 새로고침

export default function AppAutoRefresh() {
  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt != null && Date.now() - hiddenAt > STALE_MS) {
        hiddenAt = null;
        location.reload();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return null;
}
