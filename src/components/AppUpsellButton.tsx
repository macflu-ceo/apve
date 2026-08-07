"use client";

import { useEffect } from "react";
import { trackAppCta, resolveStoreUrl } from "@/lib/track-client";

/**
 * 상품 상세 '수수료 올리기 → 앱 다운로드' 유도 버튼 (웹 전용).
 * 앱에서 받게 될 더 높은 수수료 금액을 보여주고, 누르면 기기별 스토어/랜딩으로 이동.
 */
export default function AppUpsellButton({
  ios,
  android,
  landing,
  appAmountLabel,
  gapLabel,
}: {
  ios: string | null;
  android: string | null;
  landing: string | null;
  appAmountLabel: string; // 앱 기준 예상 수수료 (예: "39,000원")
  gapLabel: string; // 추가 이득 (예: "+13,000원")
}) {
  // 노출 기록(장치: 수수료 업셀)
  useEffect(() => {
    trackAppCta("upsell", "impression");
  }, []);

  function go() {
    trackAppCta("upsell", "click");
    const url = resolveStoreUrl({ ios, android, landing });
    if (url) window.open(url, "_blank", "noopener");
    else alert("앱 출시 후 이용하실 수 있어요.");
  }

  return (
    <button
      onClick={go}
      className="mt-2 flex w-full items-center justify-between rounded-xl2 border border-dashed border-brand/50 bg-brandsoft px-4 py-3 text-left transition hover:bg-brand/10"
    >
      <span className="text-sm">
        <span className="mr-1">📱</span>
        <b className="text-brand">앱에서 수수료 {appAmountLabel}</b>
        <span className="text-ink/70"> 으로 올리기</span>
      </span>
      <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
        {gapLabel} ↑
      </span>
    </button>
  );
}
