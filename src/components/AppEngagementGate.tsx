"use client";

// 웹 사용자의 주요 행동(상품·카테고리 열람, 코드/AI/다운로드/더보기 클릭)을 카운트해
// 5 / 20 / 40 회 도달 시 앱 다운로드 팝업을 자동 노출한다. 각 임계값당 1회만.
// 장치별 성과 추적: 팝업마다 고유 source(pop5/pop20/pop40)로 노출·클릭 기록.
import { useCallback, useEffect, useRef, useState } from "react";
import { trackAppCta, resolveStoreUrl } from "@/lib/track-client";

const THRESHOLDS: { at: number; source: string }[] = [
  { at: 5, source: "pop5" },
  { at: 20, source: "pop20" },
  { at: 40, source: "pop40" },
];
const COUNT_KEY = "cta_engage_count";
const SHOWN_KEY = "cta_pop_shown"; // 이미 노출한 임계값 목록

export default function AppEngagementGate({
  ios,
  android,
  landing,
}: {
  ios: string | null;
  android: string | null;
  landing: string | null;
}) {
  const [active, setActive] = useState<{ source: string } | null>(null);
  const shownRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SHOWN_KEY);
      if (raw) shownRef.current = new Set(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const onEngage = () => {
      let count = 0;
      try {
        count = Number(localStorage.getItem(COUNT_KEY) || "0") + 1;
        localStorage.setItem(COUNT_KEY, String(count));
      } catch {
        return;
      }
      const hit = THRESHOLDS.find((t) => t.at === count && !shownRef.current.has(t.at));
      if (hit) {
        shownRef.current.add(hit.at);
        try {
          localStorage.setItem(SHOWN_KEY, JSON.stringify([...shownRef.current]));
        } catch {
          /* noop */
        }
        setActive({ source: hit.source });
      }
    };
    window.addEventListener("cta-engage", onEngage);
    return () => window.removeEventListener("cta-engage", onEngage);
  }, []);

  // 노출 기록
  useEffect(() => {
    if (active) trackAppCta(active.source, "impression");
  }, [active]);

  const close = useCallback(() => setActive(null), []);

  const go = useCallback(() => {
    if (!active) return;
    trackAppCta(active.source, "click");
    const url = resolveStoreUrl({ ios, android, landing }) || `/app?src=${active.source}`;
    setActive(null);
    window.location.href = url;
  }, [active, ios, android, landing]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brandsoft text-2xl">📱</div>
        <div className="text-lg font-black text-ink">앱에서 더 편하게 이용하세요</div>
        <p className="mt-1.5 text-sm text-ink/60">
          앱을 설치하면 더 빠르고, <b className="text-brand">앱 전용 혜택</b>도 받을 수 있어요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={go}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            앱 다운로드
          </button>
          <button onClick={close} className="text-xs text-sub hover:text-ink">
            나중에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
