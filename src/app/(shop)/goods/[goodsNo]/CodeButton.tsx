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
  // 담은 직후 잠깐 뜨는 안내. 링크를 눌러 넘어갈 수 있어야 하므로 너무 짧으면 안 된다.
  const [added, setAdded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function addToSelection() {
    setAdding(true);
    const r = await addMultiLinkItem(productId);
    setAdding(false);
    setAdded(r.ok ? "추가되었습니다." : (r.message ?? "담지 못했습니다."));
    setTimeout(() => setAdded(null), 4000);
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
            <button className="btn-line mt-2 w-full" onClick={addToSelection} disabled={adding}>
              {adding ? "담는 중…" : "＋ 내 셀렉션에 바로담기"}
            </button>
          )}
        </div>
      )}

      {added && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl2 bg-ink px-4 py-3 text-sm text-white">
          <span>{added}</span>
          <Link href="/me/multilink" className="shrink-0 font-bold text-[#A9B8FF]">
            멀티링크 보러가기 ›
          </Link>
        </div>
      )}
    </div>
  );
}
