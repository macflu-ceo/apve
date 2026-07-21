"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await adminLogin(user, pw);
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setErr(res.message ?? "로그인 실패");
      }
    });
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-xl2 border border-line bg-white p-6">
      <div className="text-center text-lg font-black text-brand">돈버는명품샵 · 어드민</div>
      <input className="field" placeholder="아이디" value={user} onChange={(e) => setUser(e.target.value)} />
      <input className="field" type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} />
      <button className="btn-brand w-full" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
      {err && <p className="text-center text-sm text-red-600">{err}</p>}
    </form>
  );
}
