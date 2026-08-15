"use client";

// 비아엘리떼 몰과의 가격 차이 안내 — ? 아이콘에 마우스오버(PC)/탭(모바일) 시 설명 툴팁.
import { useEffect, useRef, useState } from "react";

export default function PriceNotice() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // 바깥 탭/클릭 시 닫기 (모바일)
  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  return (
    <span ref={ref} className="relative mt-1.5 flex items-center gap-1 text-[11px] text-sub">
      비아엘리떼 몰과 가격이 잠시 다를 수 있어요
      <button
        type="button"
        aria-label="가격 차이 안내"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line-strong text-[10px] font-bold text-ink/50 hover:bg-brandsoft hover:text-brand"
      >
        ?
      </button>
      {open && (
        <span className="absolute bottom-6 left-0 z-30 w-72 rounded-xl border border-line bg-white p-3 text-xs leading-relaxed text-ink/80 shadow-lg">
          구매는 <b>비아엘리떼 온라인몰</b>로 이동해 진행돼요. 비아엘리떼는 이탈리아 부티크 창고와
          실시간 API로 연동되고, 돈버는 명품샵은 그 데이터를 받아 표시하기 때문에 <b>최신화 타이밍이
          잠깐 어긋나면 가격이 미미하게 다를 수 있어요.</b> 실제 결제 금액은 이동한 페이지 기준입니다.
        </span>
      )}
    </span>
  );
}
