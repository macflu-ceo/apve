"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/track-client";

/**
 * 웹에서만 노출되는 앱 다운로드 유도 바.
 *  · 모바일(iOS/Android): 해당 스토어로 바로 이동
 *  · PC: 랜딩(QR) 페이지로 이동
 * 앱 웹뷰 안에서는 서버가 아예 렌더링하지 않는다(platform=web일 때만 마운트).
 */
export default function AppInstallBar({
  ios,
  android,
  landing,
}: {
  ios: string | null;
  android: string | null;
  landing: string | null;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // 사용자가 닫았으면 유지
    if (localStorage.getItem("appbar_dismissed") === "1") setHidden(true);
    else setHidden(false);
  }, []);

  if (!ios && !android && !landing) return null;
  if (hidden) return null;

  function target(): string | null {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return ios || landing;
    if (/Android/i.test(ua)) return android || landing;
    return landing || ios || android; // PC
  }

  function go() {
    trackEvent("click", { label: "appdownload" });
    const url = target();
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="relative z-40 flex items-center gap-2 bg-ink px-4 py-2 text-white">
      <span className="text-lg">📱</span>
      <div className="min-w-0 flex-1 text-xs leading-tight sm:text-sm">
        <b>앱에서 더 높은 수수료</b> — 첫 판매 특별 혜택은 앱 전용
      </div>
      <button
        onClick={go}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink hover:bg-white/90"
      >
        앱 다운로드
      </button>
      <button
        aria-label="닫기"
        onClick={() => {
          localStorage.setItem("appbar_dismissed", "1");
          setHidden(true);
        }}
        className="shrink-0 px-1 text-white/70 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
