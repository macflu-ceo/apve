"use client";

// 카카오 회원가입 화면 — 약관 동의 후 카카오 로그인으로 진행.
// 연동 키(NEXT_PUBLIC_KAKAO_READY)가 켜지기 전에는 준비 안내를 띄운다.
import { useState } from "react";
import Link from "next/link";

const ITEMS = [
  { key: "tos", label: "[필수] 서비스 이용약관 동의", href: "/terms?doc=service", required: true },
  { key: "privacy", label: "[필수] 개인정보 수집·이용 동의", href: "/terms?doc=privacy_policy", required: true },
  { key: "channel", label: "[선택] 카카오톡 채널 추가·혜택 알림", href: null, required: false },
] as const;

export default function SignupKakao() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allRequired = ITEMS.filter((i) => i.required).every((i) => checked[i.key]);
  const allChecked = ITEMS.every((i) => checked[i.key]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked(Object.fromEntries(ITEMS.map((i) => [i.key, next])));
  };

  const start = () => {
    if (!allRequired) return;
    window.location.href = "/auth/kakao/start";
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleAll}
        className="flex w-full items-center gap-3 rounded-xl2 border border-line bg-brandsoft px-4 py-3 text-left"
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded ${allChecked ? "bg-brand text-white" : "border border-line-strong bg-white"}`}>
          {allChecked && "✓"}
        </span>
        <span className="text-sm font-bold">아래 약관에 모두 동의합니다</span>
      </button>

      <div className="mt-2 space-y-1.5 px-1">
        {ITEMS.map((i) => (
          <div key={i.key} className="flex items-center gap-3 py-1">
            <button
              type="button"
              aria-label={i.label}
              onClick={() => setChecked((c) => ({ ...c, [i.key]: !c[i.key] }))}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${checked[i.key] ? "bg-brand text-white" : "border border-line-strong bg-white"}`}
            >
              {checked[i.key] && "✓"}
            </button>
            <span className="text-sm">
              {i.label.startsWith("[필수]") ? <b className="text-brand">[필수]</b> : <span className="text-sub">[선택]</span>}
              {" "}{i.label.replace(/^\[(필수|선택)\]\s*/, "")}
            </span>
            {i.href && (
              <Link href={i.href} className="ml-auto shrink-0 text-xs text-sub underline">
                보기
              </Link>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!allRequired}
        className="mt-4 w-full rounded-xl bg-[#FEE500] py-3.5 text-sm font-extrabold text-[#191919] transition active:scale-[0.99] disabled:opacity-40"
      >
        카카오계정으로 회원가입
      </button>
      <p className="mt-2 text-center text-xs text-sub">필수 약관에 동의해야 회원가입을 진행할 수 있습니다.</p>
    </div>
  );
}
