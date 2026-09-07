"use client";

import { useState } from "react";
import Link from "next/link";
import { issueLink } from "./actions";
import { addMultiLinkItem } from "@/app/(shop)/me/multilink/actions";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { trackEvent, trackAppCta, resolveStoreUrl } from "@/lib/track-client";

export default function CodeButton({
  goodsNo,
  productId,
  isConcierge = false,
}: {
  goodsNo: string;
  productId: string;
  /** 컨시어지만 셀렉션에 담을 수 있다 */
  isConcierge?: boolean;
}) {
  const { open } = useAuthModal();
  const [url, setUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appUpsell, setAppUpsell] = useState<{ msg: string; ios: string | null; android: string | null; landing: string | null } | null>(null);
  // 담기 흐름: 버튼은 「완료」까지만, 안내는 화면 아래에서 토스트로 올라왔다가
  // 2초쯤 머문 뒤 흐려지며 내려간다. (보러가기 링크는 그 사이에 누를 수 있다)
  const [added, setAdded] = useState<{ msg: string; ok: boolean } | null>(null);
  const [toastShown, setToastShown] = useState(false);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  async function addToSelection() {
    setAdding(true);
    const r = await addMultiLinkItem(productId);
    setAdding(false);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
    setAdded({ msg: r.ok ? "내 셀렉션에 들어갔습니다" : (r.message ?? "담지 못했습니다."), ok: !!r.ok });
    requestAnimationFrame(() => requestAnimationFrame(() => setToastShown(true)));
    setTimeout(() => setToastShown(false), 2300); // 머무는 시간
    setTimeout(() => setAdded(null), 2900); // 사라지는 트랜지션 후 제거
  }

  async function make() {
    setLoading(true);
    setError(null);
    setAppUpsell(null);
    const res = await issueLink(goodsNo);
    setLoading(false);
    if (res.ok) {
      setUrl(res.url);
      setCode(res.code);
      trackEvent("click", { label: "code", goodsNo }); // 코드생성 전환 기록
    } else if (res.needAuth) {
      open("login"); // 비로그인 → 로그인 모달
    } else if (res.needApp) {
      // 웹 일일 한도 초과 → 앱 유도
      setAppUpsell({ msg: res.message, ios: res.ios ?? null, android: res.android ?? null, landing: res.landing ?? null });
      trackAppCta("codelimit", "impression", goodsNo); // 한도 도달(노출)

    } else {
      setError(res.message);
    }
  }

  function goApp() {
    if (!appUpsell) return;
    trackAppCta("codelimit", "click", goodsNo);
    const target = resolveStoreUrl({ ios: appUpsell.ios, android: appUpsell.android, landing: appUpsell.landing });
    if (target) window.open(target, "_blank", "noopener");
    else alert("앱 출시 후 이용하실 수 있어요.");
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-4">
      <button className="btn-brand w-full" onClick={make} disabled={loading}>
        {loading ? "발급 중…" : "🔗 내 코드 만들기"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {appUpsell && (
        <div className="mt-3 rounded-xl2 border border-brand/40 bg-brandsoft p-4 text-center">
          <div className="text-2xl">📱</div>
          <p className="mt-1 text-sm font-medium text-ink">{appUpsell.msg}</p>
          <button onClick={goApp} className="btn-brand mt-3 w-full">
            앱에서 무제한으로 만들기 →
          </button>
        </div>
      )}

      {url && (
        <div className="mt-3 rounded-md border border-brand/40 bg-brand/5 p-3">
          <div className="text-xs text-ink/60">
            내 판매 링크 (코드: <b>{code}</b>)
          </div>
          <div className="mt-1 break-all text-sm">{url}</div>
          <button className="btn-line mt-2 w-full" onClick={copy}>
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>

          {/* 코드를 만든 김에 셀렉션까지 — 멀티링크로 건너가 다시 찾을 필요가 없다 */}
          {isConcierge && (
            <button className="btn-line mt-2 w-full" onClick={addToSelection} disabled={adding || done}>
              {adding ? "담는 중…" : done ? "완료 ✓" : "＋ 내 셀렉션에 바로담기"}
            </button>
          )}
        </div>
      )}

      {added && (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] transition-all duration-500 ease-out ${
            toastShown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink/95 py-3 pl-5 pr-4 text-sm text-white shadow-[0_10px_30px_rgba(0,0,0,.35)] backdrop-blur">
            <span className="whitespace-nowrap">{added.msg}</span>
            {added.ok && (
              <Link href="/me/multilink" className="shrink-0 whitespace-nowrap font-bold text-[#A9B8FF]">
                보러가기 ›
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
