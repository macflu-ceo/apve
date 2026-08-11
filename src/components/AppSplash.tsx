"use client";

// 앱(웹뷰) 실행 시 어드민에 등록한 스플래시 이미지를 잠깐 전체화면으로 보여준다.
// 네이티브 스플래시(앱에 구워진 것) 다음, 웹 로딩을 가리며 표시. 실행당 1회.
import { useEffect, useState } from "react";

export default function AppSplash({ src }: { src: string }) {
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1200); // 페이드 시작
    const t2 = setTimeout(() => setGone(true), 1600); // 제거
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300"
      style={{ background: "#8a6f5e", opacity: fade ? 0 : 1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="max-h-full max-w-full object-contain" />
    </div>
  );
}
