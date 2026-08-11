"use client";

// 데스크톱 좌측에 따라다니는(고정) 앱 다운로드 QR 패널. 웹 전용, 스토어 URL 설정 시에만.
// 모바일에선 숨김(상단 AppInstallBar가 담당). 스캔 → /app 스마트링크 → 기기별 스토어.
import { useEffect, useState } from "react";
import { trackAppCta, resolveStoreUrl } from "@/lib/track-client";

export default function AppSideQr({
  qr,
  ios,
  android,
  landing,
}: {
  qr: string;
  ios: string | null;
  android: string | null;
  landing: string | null;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem("sideqr_dismissed") === "1");
  }, []);

  useEffect(() => {
    if (!hidden) trackAppCta("sideqr", "impression");
  }, [hidden]);

  if (hidden) return null;

  return (
    <aside className="fixed left-4 top-1/2 z-30 hidden w-[210px] -translate-y-1/2 xl:block">
      <div className="relative rounded-2xl border border-line bg-white p-5 text-center shadow-lg">
        <button
          aria-label="닫기"
          onClick={() => {
            localStorage.setItem("sideqr_dismissed", "1");
            setHidden(true);
          }}
          className="absolute right-2 top-2 text-sub hover:text-ink"
        >
          ✕
        </button>
        <div className="text-2xl">📱</div>
        <div className="mt-2 text-sm font-black text-ink">앱에서 더 편하게</div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink/60">
          지금 앱을 설치하면<br />더 빠르고 <b className="text-brand">앱 전용 혜택</b>도!
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="앱 다운로드 QR" className="mx-auto mt-3 h-32 w-32 rounded-lg border border-line" />
        <p className="mt-2 text-[10px] text-sub">폰 카메라로 스캔하세요</p>
        <a
          href={resolveStoreUrl({ ios, android, landing }) || "/app"}
          target="_blank"
          onClick={() => trackAppCta("sideqr", "click")}
          className="mt-3 block rounded-lg bg-brand py-2 text-xs font-bold text-white hover:opacity-90"
        >
          앱 다운로드
        </a>
      </div>
    </aside>
  );
}
