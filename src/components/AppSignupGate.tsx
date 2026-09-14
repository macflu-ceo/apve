"use client";

// 앱 첫 실행 가입 게이트 — 비로그인 상태에서 앱을 처음 켜면
// 「회원가입하고 시작하세요」 전면 화면을 띄운다. 카카오 버튼은 크게,
// 둘러보기는 아주 작게. 동의 시트(app_consent_v1)가 닫힌 뒤에만 나온다.
import { useEffect, useState } from "react";
import { startKakao } from "@/lib/kakao-client";
import { trackEvent } from "@/lib/track-client";

const CONSENT_KEY = "app_consent_v1";
const DONE_KEY = "signup_gate_done_v1"; // 둘러보기를 눌렀거나 로그인한 적 있으면 다시 안 띄움

export default function AppSignupGate({ loggedIn }: { loggedIn: boolean }) {
  const [show, setShow] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (loggedIn) {
      try { localStorage.setItem(DONE_KEY, "1"); } catch { /* noop */ }
      return;
    }
    let shown = false;
    const tick = () => {
      try {
        if (shown) return;
        if (localStorage.getItem(DONE_KEY) === "1") return;
        if (localStorage.getItem(CONSENT_KEY) !== "1") return; // 동의 시트 먼저
        shown = true;
        setShow(true);
        trackEvent("impression", { label: "signup_gate" });
      } catch { /* noop */ }
    };
    tick();
    const t = setInterval(tick, 500);
    const stop = setTimeout(() => clearInterval(t), 30_000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [loggedIn]);

  if (!show) return null;

  const skip = () => {
    try { localStorage.setItem(DONE_KEY, "1"); } catch { /* noop */ }
    trackEvent("click", { label: "signup_gate_skip" });
    setShow(false);
  };

  const start = () => {
    setStarting(true);
    void startKakao(); // signup_start 이벤트는 startKakao 안에서 기록
  };

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-gradient-to-b from-[#4A60FF] to-[#6E82FF] px-7 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -left-14 bottom-24 h-36 w-36 rounded-full bg-white/10" aria-hidden />

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-lg">🛍️</div>
        <div className="mt-5 text-[13px] font-bold tracking-[0.24em] text-white/70">CASH BOUTIQUE</div>
        <h1 className="mt-2 text-[26px] font-extrabold leading-snug">
          회원가입하고
          <br />
          바로 시작하세요
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-white/85">
          가입하면 <b className="text-[#FFE9A8]">판매 코드가 즉시 발급</b>되고
          <br />
          첫 판매는 <b className="text-[#FFE9A8]">수수료 20%</b>를 드려요.
        </p>

        <button
          onClick={start}
          disabled={starting}
          className="mt-9 flex w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-4 text-[16px] font-extrabold text-[#191919] shadow-[0_8px_24px_rgba(0,0,0,.2)] transition active:scale-[0.98] disabled:opacity-70"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#191919]" aria-hidden>
            <path d="M12 3C6.48 3 2 6.42 2 10.64c0 2.7 1.8 5.07 4.5 6.42l-1.15 4.2c-.1.37.32.66.64.45l5.04-3.33c.32.03.64.05.97.05 5.52 0 10-3.42 10-7.64S17.52 3 12 3z" />
          </svg>
          {starting ? "카카오로 이동 중…" : "카카오로 3초 만에 시작하기"}
        </button>
        <p className="mt-3 text-[11px] text-white/60">로그인·회원가입이 한 번에 진행돼요</p>
      </div>

      <button onClick={skip} className="mx-auto pb-1 text-[11px] text-white/50 underline underline-offset-2">
        그냥 둘러보기
      </button>
    </div>
  );
}
