"use client";

import { useState } from "react";
import { issueLink } from "./actions";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { trackEvent } from "@/lib/track-client";

export default function CodeButton({ goodsNo }: { goodsNo: string }) {
  const { open } = useAuthModal();
  const [url, setUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function make() {
    setLoading(true);
    setError(null);
    const res = await issueLink(goodsNo);
    setLoading(false);
    if (res.ok) {
      setUrl(res.url);
      setCode(res.code);
      trackEvent("click", { label: "code", goodsNo }); // 코드생성 전환 기록
    } else if (res.needAuth) {
      open("login"); // 비로그인 → 로그인 모달
    } else {
      setError(res.message);
    }
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

      {url && (
        <div className="mt-3 rounded-md border border-brand/40 bg-brand/5 p-3">
          <div className="text-xs text-ink/60">
            내 판매 링크 (코드: <b>{code}</b>)
          </div>
          <div className="mt-1 break-all text-sm">{url}</div>
          <button className="btn-line mt-2 w-full" onClick={copy}>
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>
        </div>
      )}
    </div>
  );
}
