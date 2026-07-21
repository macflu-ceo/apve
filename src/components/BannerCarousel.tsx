"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type BannerItem = {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  bgFrom: string;
  bgTo: string;
  linkUrl: string | null;
};

export default function BannerCarousel({
  banners,
  interval = 3,
}: {
  banners: BannerItem[];
  interval?: number;
}) {
  const N = banners.length;
  const loop = N > 1;
  // 무한 순환: 배너를 3벌 복제하고 가운데 벌에서 시작 → 끝에 닿으면 티 안 나게 리셋
  const items = loop ? [...banners, ...banners, ...banners] : banners;

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(loop ? N : 0);
  const [offset, setOffset] = useState(0);
  const [ready, setReady] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  const real = ((index % N) + N) % N;

  // 활성 슬라이드를 정중앙으로
  const recalc = useCallback((i: number) => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;
    const slide = track.children[i] as HTMLElement | undefined;
    if (!slide) return;
    setOffset(container.clientWidth / 2 - slide.offsetLeft - slide.offsetWidth / 2);
    setReady(true);
  }, []);

  useEffect(() => { recalc(index); }, [index, recalc, N]);

  useEffect(() => {
    const onResize = () => recalc(index);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, recalc]);

  // 자동 전환 (항상 앞으로)
  useEffect(() => {
    if (!loop || paused || interval <= 0) return;
    const t = setInterval(() => setIndex((p) => p + 1), interval * 1000);
    return () => clearInterval(t);
  }, [loop, paused, interval]);

  // 경계(첫/셋째 벌)에 닿으면 전환 끝난 뒤 가운데 벌로 조용히 리셋
  useEffect(() => {
    if (!loop) return;
    if (index >= 2 * N || index < N) {
      const t = setTimeout(() => {
        setAnimate(false);
        setIndex((i) => (i >= 2 * N ? i - N : i + N));
      }, 520);
      return () => clearTimeout(t);
    }
  }, [index, N, loop]);

  // 조용한 리셋 직후 애니메이션 복구
  useEffect(() => {
    if (animate) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(r);
  }, [animate]);

  const go = (delta: number) => setIndex((i) => i + delta);
  const goTo = (r: number) => setIndex(loop ? N + r : r);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden px-4 py-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex items-center"
        style={{
          transform: `translateX(${offset}px)`,
          transition: ready && animate ? "transform 500ms ease-out" : "none",
        }}
      >
        {items.map((b, i) => {
          const active = i === index;
          const light = !!b.imageUrl;
          return (
            <Link
              key={i}
              href={b.linkUrl || "#"}
              className={`relative mx-2 aspect-square w-[74%] shrink-0 overflow-hidden rounded-xl2 transition-all duration-500 sm:w-[52%] md:w-[40%] ${
                active ? "scale-100 opacity-100 shadow-lg" : "scale-[0.86] opacity-45"
              }`}
              style={
                b.imageUrl
                  ? { backgroundImage: `url(${b.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { backgroundImage: `linear-gradient(135deg, ${b.bgFrom}, ${b.bgTo})` }
              }
              tabIndex={active ? 0 : -1}
            >
              {light && <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className={`text-xl font-black md:text-2xl ${light ? "text-white" : "text-ink"}`}>{b.title}</div>
                {b.subtitle && (
                  <div className={`mt-1 text-sm font-semibold ${light ? "text-white/85" : "text-ink/60"}`}>{b.subtitle}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {loop && (
        <>
          <button
            aria-label="이전"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-md hover:bg-white"
          >
            ‹
          </button>
          <button
            aria-label="다음"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-md hover:bg-white"
          >
            ›
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`${i + 1}번 배너`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === real ? "w-5 bg-ink" : "w-1.5 bg-ink/25"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
