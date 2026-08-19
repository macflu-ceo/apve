"use client";

// 앱(웹뷰) 전용 뒤로가기 — iOS엔 하드웨어 뒤로가기가 없어 상세페이지 이탈 수단이 필요.
import { useRouter } from "next/navigation";

export default function AppBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="mb-3 flex items-center gap-1 text-sm font-semibold text-ink/70"
      aria-label="뒤로가기"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      뒤로
    </button>
  );
}
