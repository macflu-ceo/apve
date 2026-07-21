"use client";

import { useState } from "react";

/** 현재 도메인 기준 절대 URL(origin + path)을 클립보드에 복사 */
export default function CopyLinkButton({
  path,
  label = "링크 복사",
  className = "btn-line px-3 py-2 text-xs",
}: {
  path: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 권한 실패 시 폴백
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "복사됨 ✓" : label}
    </button>
  );
}
