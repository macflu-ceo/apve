"use client";

// 당겨서 새로고침 (앱 전용). 스크롤 최상단에서 아래로 당기면 새로고침.
// 모바일 브라우저는 자체 pull-to-refresh가 있어 앱(웹뷰)에서만 마운트한다.
import { useEffect, useRef, useState } from "react";

const THRESHOLD = 64; // 이 이상 당기면 새로고침
const MAX = 120;

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const pullVal = useRef(0);

  useEffect(() => {
    const set = (v: number) => {
      pullVal.current = v;
      setPull(v);
    };

    function onStart(e: TouchEvent) {
      if (window.scrollY <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    }
    function onMove(e: TouchEvent) {
      if (!pulling.current || startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        e.preventDefault(); // 네이티브 오버스크롤(고무줄) 방지
        set(Math.min(MAX, dy * 0.5));
      } else if (dy <= 0) {
        pulling.current = false;
        set(0);
      }
    }
    function onEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (pullVal.current >= THRESHOLD) {
        setRefreshing(true);
        set(THRESHOLD);
        setTimeout(() => location.reload(), 400);
      } else {
        set(0);
      }
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [refreshing]);

  const show = pull > 0 || refreshing;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center pt-[env(safe-area-inset-top)]"
      style={{
        transform: `translateY(${show ? pull - 6 : -48}px)`,
        transition: pulling.current ? "none" : "transform 0.25s ease",
      }}
      aria-hidden
    >
      <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4A60FF"
          strokeWidth="2"
          className={refreshing ? "animate-spin" : ""}
          style={refreshing ? undefined : { transform: `rotate(${Math.min(360, pull * 4)}deg)` }}
        >
          <path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
