"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track-client";

/** 라우트 변경마다 페이지뷰 1건 기록 (같은 경로 중복 전송 방지). */
export default function Tracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    trackEvent("page", { path: pathname });
  }, [pathname]);

  return null;
}
