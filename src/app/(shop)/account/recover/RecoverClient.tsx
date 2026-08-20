"use client";

// 아이디 찾기 / 비밀번호 재설정 — 라온 본인인증 후 콜백(?tab=…&iv=1)으로 복귀
import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getIdentitySummary,
  findUsernameByIdentity,
  verifyResetIdentity,
  resetPasswordByIdentity,
} from "@/lib/auth-actions";

type Tab = "find-id" | "reset-pw";

export default function RecoverClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [pending, start] = useTransition();

  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "find-id");
  const [verified, setVerified] = useState(false);
  const [msg, setMsg] = useState<string | null>(sp.get("iv_error"));

  // 아이디 찾기 결과
  const [found, setFound] = useState<{ username: string; joinedAt: string } | null>(null);

  // 비번 재설정
  const [username, setUsername] = useState("");
  const [idOk, setIdOk] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);

  // 인증 복귀 감지 → 티켓 확인
  useEffect(() => {
    if (sp.get("iv") === "1") {
      getIdentitySummary().then((r) => {
        if (r.verified) {
          setVerified(true);
          if (r.flow === "find-id" && tab === "find-id") {
            // 아이디 찾기: 인증 즉시 조회
            findUsernameByIdentity().then((f) => {
              if (f.ok) setFound({ username: f.username!, joinedAt: f.joinedAt! });
              else setMsg(f.message ?? "조회 실패");
            });
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startVerify(flow: Tab) {
    window.location.href = `/auth/identity/start?flow=${flow}`;
  }

  function checkId() {
    setMsg(null);
    start(async () => {
      const r = await verifyResetIdentity(username);
      if (r.ok) setIdOk(true);
      else setMsg(r.message ?? "확인 실패");
    });
  }

  function savePw() {
    setMsg(null);
    if (pw1.length < 6) return setMsg("비밀번호는 6자 이상이어야 합니다.");
    if (pw1 !== pw2) return setMsg("비밀번호가 서로 다릅니다.");
    start(async () => {
      const r = await resetPasswordByIdentity(username, pw1);
      if (r.ok) setDone(true);
      else setMsg(r.message ?? "변경 실패");
    });
  }

  const switchTab = (t: Tab) => {
    setTab(t);
    setMsg(null);
    router.replace(`/account/recover?tab=${t}`);
  };

  return (
    <div className="mt-6">
      {/* 탭 */}
      <div className="mb-5 flex gap-2 text-sm font-bold">
        {(["find-id", "reset-pw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 rounded-lg py-2 ${tab === t ? "bg-ink text-white" : "bg-line text-sub"}`}
          >
            {t === "find-id" ? "아이디 찾기" : "비밀번호 재설정"}
          </button>
        ))}
      </div>

      {tab === "find-id" ? (
        found ? (
          <div className="card space-y-3 p-6 text-center">
            <div className="text-sm text-sub">회원님의 아이디</div>
            <div className="text-2xl font-black text-brand">{found.username}</div>
            <div className="text-xs text-sub">가입일 {found.joinedAt}</div>
            <a href="/?login=1" className="btn-brand mt-2 block w-full">로그인 하러가기</a>
          </div>
        ) : (
          <div className="card space-y-4 p-6">
            <p className="text-sm text-ink/80">본인인증을 완료하면 명의로 가입된 아이디를 알려드려요.</p>
            <button onClick={() => startVerify("find-id")} disabled={pending} className="btn-brand w-full">
              📱 휴대폰 본인인증
            </button>
          </div>
        )
      ) : done ? (
        <div className="card space-y-3 p-6 text-center">
          <div className="text-lg font-bold">✅ 비밀번호 변경 완료</div>
          <p className="text-sm text-sub">새 비밀번호로 로그인해주세요.</p>
          <a href="/?login=1" className="btn-brand mt-2 block w-full">로그인 하러가기</a>
        </div>
      ) : (
        <div className="card space-y-4 p-6">
          {!verified ? (
            <>
              <p className="text-sm text-ink/80">본인인증 후 아이디를 확인하고 새 비밀번호를 설정해요.</p>
              <button onClick={() => startVerify("reset-pw")} disabled={pending} className="btn-brand w-full">
                📱 휴대폰 본인인증
              </button>
            </>
          ) : !idOk ? (
            <>
              <div className="text-sm font-bold text-green-700">✓ 본인인증 완료</div>
              <input className="field w-full" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
              <button onClick={checkId} disabled={pending || !username.trim()} className="btn-brand w-full">
                {pending ? "확인 중…" : "계정 확인"}
              </button>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-green-700">✓ 계정 확인됨 — 새 비밀번호를 설정하세요</div>
              <input className="field w-full" type="password" placeholder="새 비밀번호 (6자 이상)" value={pw1} onChange={(e) => setPw1(e.target.value)} />
              <input className="field w-full" type="password" placeholder="새 비밀번호 확인" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              <button onClick={savePw} disabled={pending} className="btn-brand w-full">
                {pending ? "저장 중…" : "비밀번호 변경"}
              </button>
            </>
          )}
        </div>
      )}

      {msg && <p className="mt-3 text-center text-sm text-red-600">{msg}</p>}
    </div>
  );
}
