"use client";

import { useEffect, useState } from "react";

type Slide = { id: string; imageUrl: string; caption: string | null };

// 온보딩 버전 — 내용 개편 시 이 값을 올리면 기존 사용자에게도 다시 보임
const SEEN_KEY = "onboarded_v1";

/**
 * 첫 실행(웹/앱 최초 진입) 전체화면 안내. 로컬스토리지로 1회만 노출.
 * 슬라이드가 없거나 이미 본 사용자면 아무것도 렌더하지 않음.
 */
export default function OnboardingOverlay() {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) === "1") return;
    let alive = true;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.slides) && d.slides.length > 0) setSlides(d.slides);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!slides || slides.length === 0) return null;

  const last = idx >= slides.length - 1;
  function finish() {
    localStorage.setItem(SEEN_KEY, "1");
    setSlides(null);
  }
  function next() {
    if (last) finish();
    else setIdx((i) => i + 1);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* 건너뛰기 */}
      <div className="flex justify-end p-4">
        <button onClick={finish} className="rounded-full bg-white/15 px-3 py-1 text-sm text-white/90">
          건너뛰기
        </button>
      </div>

      {/* 슬라이드 */}
      <div
        className="flex flex-1 flex-col items-center justify-center overflow-hidden px-6"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX != null) {
            const dx = e.changedTouches[0].clientX - touchX;
            if (dx < -40 && !last) setIdx((i) => i + 1);
            if (dx > 40 && idx > 0) setIdx((i) => i - 1);
          }
          setTouchX(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slides[idx].imageUrl}
          alt=""
          className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain"
        />
        {slides[idx].caption && (
          <p className="mt-6 max-w-md text-center text-base leading-relaxed text-white/90">
            {slides[idx].caption}
          </p>
        )}
      </div>

      {/* 닷 + 버튼 */}
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full max-w-md rounded-xl2 bg-white py-3 text-center font-bold text-ink"
        >
          {last ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
