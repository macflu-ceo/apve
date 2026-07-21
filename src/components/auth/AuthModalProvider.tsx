"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login, signup, requestIdentity } from "@/lib/auth-actions";

type Mode = "login" | "signup";
type Ctx = { open: (mode?: Mode) => void; close: () => void };
const AuthCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useAuthModal = () => useContext(AuthCtx);

export default function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [openState, setOpenState] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  const open = (m: Mode = "login") => {
    setMode(m);
    setOpenState(true);
  };
  const close = () => setOpenState(false);

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
  const [s, setS] = useState({ username: "", password: "", name: "", phone: "" });
  const [ci, setCi] = useState<string | null>(null);

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
    start(async () => {
      const r = await requestIdentity(s.name, s.phone);
      if (r.ok) {
        setCi(r.ci);
        setMsg({ ok: true, text: "본인인증 완료" });
      } else {
        setMsg({ ok: false, text: r.message ?? "본인인증 실패" });
      }
    });
  }

  function doSignup() {
    start(async () => {
      const r = await signup({ ...s, ci });
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
        className="w-full max-w-md rounded-t-2xl bg-white p-6 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xl font-black text-brand">돈버는명품샵</div>
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
            <input className="field" placeholder="아이디" value={lid} onChange={(e) => setLid(e.target.value)} />
            <input className="field" type="password" placeholder="비밀번호" value={lpw} onChange={(e) => setLpw(e.target.value)} />
            <button className="btn-brand w-full" onClick={doLogin} disabled={pending}>
              {pending ? "처리 중…" : "로그인"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input className="field" placeholder="아이디 (영문/숫자 4~20자)" value={s.username} onChange={(e) => setS({ ...s, username: e.target.value })} />
            <input className="field" type="password" placeholder="비밀번호 (6자 이상)" value={s.password} onChange={(e) => setS({ ...s, password: e.target.value })} />
            <input className="field" placeholder="이름(실명)" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
            <div className="flex gap-2">
              <input className="field flex-1" placeholder="휴대폰번호" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} />
              <button
                className={`shrink-0 rounded-xl px-3 text-sm font-bold ${ci ? "bg-deal/15 text-deal" : "border border-ink/20"}`}
                onClick={doVerify}
                disabled={pending || !!ci}
              >
                {ci ? "인증완료 ✓" : "본인인증"}
              </button>
            </div>
            <button className="btn-brand w-full" onClick={doSignup} disabled={pending || !ci}>
              {pending ? "처리 중…" : "가입 신청"}
            </button>
            <p className="text-center text-xs text-sub">가입 신청 후 관리자 승인이 완료되면 이용할 수 있어요.</p>
          </div>
        )}

        {msg && <p className={`mt-3 text-center text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
