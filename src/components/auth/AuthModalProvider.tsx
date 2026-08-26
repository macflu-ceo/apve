"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login, signup, requestIdentity, confirmIdentity, getIdentitySummary, checkUsernameAvailable, discardIdentityTicket } from "@/lib/auth-actions";
import Logo from "@/components/Logo";

// 본인인증 방식: raon(라온 OmniOne CX, 실서비스) | portone | mock(개발). 환경변수로 전환.
const IDP = process.env.NEXT_PUBLIC_IDENTITY_PROVIDER ?? "mock";
const SIGNUP_DRAFT_KEY = "signup_draft_v1"; // 본인인증 리다이렉트 전 입력값 보존

type Mode = "login" | "signup";
type Ctx = { open: (mode?: Mode) => void; close: () => void };
const AuthCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useAuthModal = () => useContext(AuthCtx);

export default function AuthModalProvider({
  children,
  loggedIn = false,
}: {
  children: React.ReactNode;
  loggedIn?: boolean;
}) {
  const [openState, setOpenState] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  const open = (m: Mode = "login") => {
    setMode(m);
    setOpenState(true);
  };
  const close = () => {
    setOpenState(false);
    discardIdentityTicket().catch(() => {}); // 창 닫으면 인증 무효 → 다시 열면 처음부터
  };

  // 본인인증 복귀(?signup=1) / 로그인 유도(?login=1) 시 모달 자동 오픈
  // 이미 로그인된 상태면 열지 않음 (가입 완료 후 새로고침 시 재오픈 버그 방지)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!loggedIn) {
      if (q.get("signup") === "1") open("signup");
      else if (q.get("login") === "1") open("login");
    }
    if (q.get("signup") || q.get("login") || q.get("iv") || q.get("iv_error")) {
      // 새로고침 시 재오픈/재처리 방지 — 파라미터 제거
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  return (
    <AuthCtx.Provider value={{ open, close }}>
      {children}
      {openState && <AuthModal mode={mode} setMode={setMode} close={close} />}
    </AuthCtx.Provider>
  );
}

function AuthModal({ mode, setMode, close }: { mode: Mode; setMode: (m: Mode) => void; close: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 로그인
  const [lid, setLid] = useState("");
  const [lpw, setLpw] = useState("");

  // 회원가입
  const [s, setS] = useState({ username: "", password: "", name: "", nickname: "", email: "", phone: "" });
  const [password2, setPassword2] = useState("");
  const [idCheck, setIdCheck] = useState<null | { available: boolean; text: string }>(null);
  const [ci, setCi] = useState<string | null>(null);
  const [agree, setAgree] = useState({
    service: false,
    privacy: false,
    partnerPolicy: false,
    age14: false,
    marketing: false,
  });
  const allRequired = agree.service && agree.privacy && agree.partnerPolicy && agree.age14;
  const [ivLocked, setIvLocked] = useState(false); // 라온 인증 완료 → 실명·전화 잠금

  // 라온 본인인증 복귀: 드래프트 복원 + 서버 티켓 확인 → 인증완료 표시
  useEffect(() => {
    if (IDP !== "raon") return;
    const q = new URLSearchParams(window.location.search);
    try {
      const draft = sessionStorage.getItem(SIGNUP_DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        setS((prev) => ({ ...prev, ...d.s }));
        if (d.agree) setAgree(d.agree);
        sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
      }
    } catch { /* 무시 */ }
    if (q.get("iv_error")) setMsg({ ok: false, text: q.get("iv_error") || "본인인증 실패" });
    getIdentitySummary().then((r) => {
      if (r.verified && r.flow === "signup") {
        setCi("raon-ticket"); // 실제 CI는 서버 티켓에서 — 클라이언트는 표식만
        setIvLocked(true);
        setS((prev) => ({ ...prev, name: r.name || prev.name, phone: r.phone || prev.phone }));
        setMsg({ ok: true, text: "✅ 본인인증이 완료되었습니다. 아이디와 비밀번호를 설정해주세요." });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const allChecked = allRequired && agree.marketing;
  const toggleAll = (v: boolean) =>
    setAgree({ service: v, privacy: v, partnerPolicy: v, age14: v, marketing: v });

  function doLogin() {
    start(async () => {
      const r = await login(lid, lpw);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        router.refresh();
        setTimeout(close, 500);
      }
    });
  }

  function doVerify() {
    // 라온 OmniOne CX: 입력값 보존 후 인증창으로 이동 (카카오/토스 인증서)
    if (IDP === "raon") {
      try {
        sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify({ s, agree }));
      } catch { /* 무시 */ }
      window.location.href = "/auth/identity/start?flow=signup";
      return;
    }
    // 포트원 실제 본인인증: 팝업 → identityVerificationId → 서버 검증
    if (IDP === "portone") {
      start(async () => {
        try {
          const PortOne = await import("@portone/browser-sdk/v2");
          const resp = await PortOne.requestIdentityVerification({
            storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "",
            channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "",
            identityVerificationId: `identity-verification-${crypto.randomUUID()}`,
          });
          if (!resp || resp.code != null) {
            setMsg({ ok: false, text: resp?.message ?? "본인인증이 취소되었거나 실패했습니다." });
            return;
          }
          const r = await confirmIdentity(resp.identityVerificationId);
          if (r.ok) {
            setCi(r.ci);
            // 인증기관이 확인한 실명·전화로 확정
            setS((prev) => ({ ...prev, name: r.name ?? prev.name, phone: r.phone ?? prev.phone }));
            setMsg({ ok: true, text: "✅ 본인인증이 완료되었습니다." });
          } else {
            setMsg({ ok: false, text: r.message ?? "본인인증 실패" });
          }
        } catch (e) {
          setMsg({ ok: false, text: e instanceof Error ? e.message : "본인인증 오류" });
        }
      });
      return;
    }

    // mock: 이름+전화만으로 통과 (개발용)
    start(async () => {
      const r = await requestIdentity(s.name, s.phone);
      if (r.ok) {
        setCi(r.ci);
        setMsg({ ok: true, text: "✅ 본인인증이 완료되었습니다." });
      } else {
        setMsg({ ok: false, text: r.message ?? "본인인증 실패" });
      }
    });
  }

  function doSignup() {
    setMsg(null);
    if (!ci) {
      setMsg({ ok: false, text: "휴대폰 본인인증을 먼저 완료해주세요." });
      return;
    }
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(s.username.trim())) {
      setMsg({ ok: false, text: "아이디는 영문/숫자 조합 4자 이상(최대 20자)이어야 합니다." });
      return;
    }
    if (!idCheck?.available) {
      setMsg({ ok: false, text: "아이디 중복확인을 해주세요." });
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(s.password)) {
      setMsg({ ok: false, text: "비밀번호는 영문+숫자를 섞어 6자 이상이어야 합니다." });
      return;
    }
    if (s.password !== password2) {
      setMsg({ ok: false, text: "비밀번호가 서로 일치하지 않습니다." });
      return;
    }
    if (!allRequired) {
      setMsg({ ok: false, text: "필수 약관에 모두 동의해주세요." });
      return;
    }
    start(async () => {
      const r = await signup({
        ...s,
        ci,
        agreeService: agree.service,
        agreePrivacy: agree.privacy,
        agreePartnerPolicy: agree.partnerPolicy,
        agreeAge14: agree.age14,
        agreeMarketing: agree.marketing,
      });
      if (!r.ok && /본인인증/.test(r.message || "")) {
        // 서버 티켓 만료 → 1단계(인증)부터 다시
        setCi(null);
        setIvLocked(false);
        setMsg({ ok: false, text: "본인인증이 만료되었어요. 처음부터 다시 인증해주세요." });
        return;
      }
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        // 가입 즉시 로그인됨 → 새로고침 후 닫기
        router.refresh();
        setTimeout(close, 900);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={close}>
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-6 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <Logo height={22} />
          <button onClick={close} className="text-2xl leading-none text-sub">
            ×
          </button>
        </div>

        {/* 탭 */}
        <div className="mb-5 flex gap-2 text-sm font-bold">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setMsg(null); }}
              className={`flex-1 rounded-lg py-2 ${mode === m ? "bg-ink text-white" : "bg-line text-sub"}`}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div className="space-y-3">
            <input className="field" autoComplete="username" placeholder="아이디" value={lid} onChange={(e) => setLid(e.target.value)} />
            <input className="field" type="password" autoComplete="current-password" placeholder="비밀번호" value={lpw} onChange={(e) => setLpw(e.target.value)} />
            <button className="btn-brand w-full" onClick={doLogin} disabled={pending}>
              {pending ? "처리 중…" : "로그인"}
            </button>
            <a href="/account/recover" className="block text-center text-xs text-sub underline">
              아이디·비밀번호 찾기
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {!ci ? (
              /* ── 1단계: 본인인증만 (실명·연락처는 인증 결과에서 자동 수신) ── */
              <>
                <p className="text-sm leading-relaxed text-ink/70">
                  휴대폰 본인인증으로 간편하게 가입해요.
                  <br />
                  <span className="text-xs text-sub">이름·연락처는 인증 결과로 자동 입력됩니다. (카카오·토스 인증서)</span>
                </p>
                <button
                  className="btn-brand w-full"
                  onClick={() => {
                    setMsg(null);
                    doVerify();
                  }}
                  disabled={pending}
                >
                  {pending ? "처리 중…" : "📱 휴대폰 본인인증하기"}
                </button>
              </>
            ) : (
              /* ── 2단계: 인증완료 → 아이디·비밀번호 설정 ── */
              <>
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                  ✓ 본인인증 완료 — {s.name} · {s.phone}
                </div>

                <div className="flex gap-2">
                  <input
                    className="field flex-1"
                    placeholder="아이디 (영문/숫자 4자 이상)"
                    autoComplete="username"
                    value={s.username}
                    onChange={(e) => { setS({ ...s, username: e.target.value }); setIdCheck(null); }}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-xl border border-ink/20 px-3 text-sm font-bold"
                    disabled={pending || !s.username.trim()}
                    onClick={() =>
                      start(async () => {
                        const r = await checkUsernameAvailable(s.username);
                        setIdCheck({ available: !!r.available, text: r.message });
                      })
                    }
                  >
                    중복확인
                  </button>
                </div>
                {idCheck && (
                  <p className={`text-xs ${idCheck.available ? "text-green-600" : "text-red-500"}`}>
                    {idCheck.available ? "✓ " : ""}{idCheck.text}
                  </p>
                )}

                <input className="field" type="password" autoComplete="new-password" placeholder="비밀번호 (영문+숫자 혼합 6자 이상)" value={s.password} onChange={(e) => setS({ ...s, password: e.target.value })} />
                <div>
                  <input className="field w-full" type="password" autoComplete="new-password" placeholder="비밀번호 확인" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                  {password2 && (
                    <p className={`mt-1 text-xs ${s.password === password2 ? "text-green-600" : "text-red-500"}`}>
                      {s.password === password2 ? "✓ 비밀번호가 일치합니다" : "비밀번호가 일치하지 않습니다"}
                    </p>
                  )}
                </div>
                <input className="field" placeholder="닉네임 (커뮤니티 표시용, 2~12자)" value={s.nickname} onChange={(e) => setS({ ...s, nickname: e.target.value })} />
                <input className="field" type="email" placeholder="이메일" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} />

                {/* 약관 동의 */}
                <div className="rounded-xl border border-line p-3">
                  <label className="flex items-center gap-2 border-b border-line pb-2 text-sm font-bold">
                    <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} />
                    전체 동의
                  </label>
                  <div className="mt-2 space-y-1.5 text-xs">
                    {[
                      { k: "service" as const, label: "[필수] 서비스 이용약관", doc: "service" },
                      { k: "privacy" as const, label: "[필수] 개인정보 수집·이용 (가입)", doc: "privacy_signup" },
                      { k: "partnerPolicy" as const, label: "[필수] 파트너 운영정책·대가성 표시 서약", doc: "partner_policy" },
                      { k: "age14" as const, label: "[필수] 만 14세 이상입니다", doc: "age14" },
                      { k: "marketing" as const, label: "[선택] 마케팅 정보 수신 동의", doc: "marketing" },
                    ].map((row) => (
                      <div key={row.k} className="flex items-center justify-between gap-2">
                        <label className="flex flex-1 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={agree[row.k]}
                            onChange={(e) => setAgree({ ...agree, [row.k]: e.target.checked })}
                          />
                          {row.label}
                        </label>
                        <a href={`/terms?doc=${row.doc}`} target="_blank" className="shrink-0 text-sub underline">
                          보기
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn-brand w-full" onClick={doSignup} disabled={pending}>
                  {pending ? "처리 중…" : "가입 완료하기"}
                </button>
                <p className="text-center text-xs text-sub">가입 즉시 판매 코드가 자동 발급돼요.</p>
              </>
            )}
          </div>
        )}

        {msg && <p className={`mt-3 text-center text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
