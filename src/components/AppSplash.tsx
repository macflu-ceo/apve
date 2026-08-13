"use client";

// 앱 실행 시 어드민에 등록한 스플래시 이미지를 잠깐 보여준다.
// SSR HTML에 처음부터 깔려서(깜빡임 방지) 네이티브 스플래시(#D1B696)와 이어지고, 잠시 후 페이드아웃.
import { useEffect, useState } from "react";

export default function AppSplash({ image }: { image: string }) {
  const [fade, setFade] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1400); // 노출 후 페이드 시작
    const t2 = setTimeout(() => setGone(true), 1900); // 완전 제거
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#D1B696" }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="max-h-[62%] max-w-[74%] object-contain" />
    </div>
  );
}
