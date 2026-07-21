"use client";

import { useState } from "react";

export default function TryOnButton({ goodsNo }: { goodsNo: string }) {
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goodsNo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setImg(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button className="btn-line w-full" onClick={generate} disabled={loading}>
        {loading ? "생성 중…" : "🪄 AI 착용샷 만들기"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {img && (
        <div className="card mt-3 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="AI 착용샷" className="w-full object-cover" />
          <div className="p-2 text-center text-xs text-ink/50">AI 착용샷 (미리보기)</div>
        </div>
      )}
    </div>
  );
}
