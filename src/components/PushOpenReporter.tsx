"use client";

// 푸시 알림을 탭해서 열린 경우, URL의 ?pushId= 를 읽어 열람을 1회 기록한다.
import { useEffect } from "react";

export default function PushOpenReporter() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pushId = params.get("pushId");
      if (!pushId) return;
      fetch("/api/push/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushId }),
        keepalive: true,
      }).catch(() => {});
      // 주소에서 pushId 제거(재열람·공유 시 중복 방지·깔끔)
      params.delete("pushId");
      const qs = params.toString();
      const clean = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState(null, "", clean);
    } catch {
      /* noop */
    }
  }, []);
  return null;
}
