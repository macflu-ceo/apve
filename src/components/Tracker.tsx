"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track-client";

/** 라우트 변경마다 페이지뷰 1건 기록 (같은 경로 중복 전송 방지). */
export default function Tracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;

    // 첫 진입에만 유입 경로(외부 리퍼러)·UTM 을 함께 전송 → 세션 획득 소스 귀속
    if (first.current) {
      first.current = false;
      const sp = new URLSearchParams(window.location.search);
      trackEvent("page", {
        path: pathname,
        referrer: document.referrer || undefined,
        utmSource: sp.get("utm_source") || undefined,
        utmMedium: sp.get("utm_medium") || undefined,
        utmCampaign: sp.get("utm_campaign") || undefined,
      });
    } else {
      trackEvent("page", { path: pathname });
    }
  }, [pathname]);

  return null;
}
