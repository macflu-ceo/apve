"use client";

import { useState, useTransition } from "react";
import { extendConcierge } from "./actions";

/** 자격 3개월 연장. 오늘부터 다시 센다. */
export default function ExtendButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <span className="text-xs font-bold text-deal">연장됨</span>;

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`${name} 의 컨시어지 자격을 오늘부터 3개월 연장합니다.`)) return;
        start(async () => {
          await extendConcierge(id);
          setDone(true);
        });
      }}
      className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold transition hover:bg-brandsoft disabled:opacity-40"
    >
      {pending ? "연장 중…" : "3개월 연장"}
    </button>
  );
}
