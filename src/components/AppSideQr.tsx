"use client";

// PC(넓은 화면) 좌측 고정 패널 — 화해 스타일. 사이트는 모바일 UI 한 벌로 통일하고,
// PC의 남는 공간에는 브랜드 + 앱 다운로드(QR)를 보여준다. 웹 전용.
import { useEffect } from "react";
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
  useEffect(() => {
    if (window.innerWidth >= 1000) trackAppCta("sideqr", "impression");
  }, []);

  const store = resolveStoreUrl({ ios, android, landing });

  return (
    <aside className="fixed left-[calc(50%-480px)] top-1/2 z-30 hidden w-[200px] -translate-y-1/2 min-[1000px]:block">
      <div className="text-center">
        <img src="/logo.png" alt="돈버는 명품샵" className="mx-auto h-6" />
        <div className="mt-4 text-[17px] font-black leading-snug text-ink">
          새로운 명품 부업의
          <br />
          발견
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-sub">
          앱에서 명품 추천부터
          <br />
          수수료 적립까지 받아보세요
        </p>
        <div className="mx-auto mt-4 w-fit rounded-xl border border-line bg-white p-2.5 shadow-sm">
          <img src={qr} alt="앱 다운로드 QR" className="h-24 w-24" />
        </div>
        <div className="mt-1.5 text-[10px] text-sub">QR 스캔 → 스토어 이동</div>
        {store && (
          <a
            href={store}
            target="_blank"
            onClick={() => trackAppCta("sideqr", "click")}
            className="mt-3 inline-block rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white"
          >
            앱 다운로드
          </a>
        )}
      </div>
    </aside>
  );
}
