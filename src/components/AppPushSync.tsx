"use client";

// 앱 실행 때마다 현재 로그인 계정으로 FCM 토큰을 재등록한다.
// (토큰은 등록 시점의 로그인 계정에 연결되므로, 계정을 바꿔 로그인하면 재등록이 필요)
import { useEffect } from "react";
import { requestAppPushPermission, bindPushTapNavigation } from "@/lib/push-client";

export default function AppPushSync() {
  useEffect(() => {
    // 알림 탭 딥링크는 동의 여부와 무관하게 항상 연결 (콜드스타트 포함)
    bindPushTapNavigation();
    // 알림 동의를 이미 한 경우에만 조용히 재등록 (권한 이미 granted라 팝업 안 뜸)
    if (localStorage.getItem("app_noti_consent") === "1") {
      requestAppPushPermission();
    }
  }, []);
  return null;
}
