"use client";

import { useEffect, useState } from "react";
import { trackAppCta, resolveStoreUrl } from "@/lib/track-client";

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

  // 노출 기록(장치: 상단 바) — 바가 실제로 보일 때 1회
  useEffect(() => {
    if (!hidden && (ios || android || landing)) trackAppCta("topbar", "impression");
  }, [hidden, ios, android, landing]);

  if (!ios && !android && !landing) return null;
  if (hidden) return null;

  function go() {
    trackAppCta("topbar", "click");
    const url = resolveStoreUrl({ ios, android, landing });
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="relative z-40 flex items-center gap-2 bg-ink px-4 py-2 text-white">
      <span className="text-lg">📱</span>
      <div className="min-w-0 flex-1 text-xs leading-tight">
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
