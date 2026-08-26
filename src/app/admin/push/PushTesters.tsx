"use client";

// 테스트 수신자 관리 — 등급과 무관하게 아이디로 지정/해제
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPushTesterAction } from "./actions";

export default function PushTesters({
  testers,
}: {
  testers: { username: string; name: string; deviceCount: number }[];
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (u: string, on: boolean) =>
    start(async () => {
      const r = await setPushTesterAction(u, on);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setUsername("");
        router.refresh();
      }
    });

  return (
    <div className="card p-5">
      <h2 className="text-base font-bold">🧪 테스트 수신자</h2>
      <p className="mt-1 text-xs text-sub">
        여기 지정된 회원의 기기로만 ‘테스트 발송’이 갑니다. 등급(수수료)과는 무관합니다.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="회원 아이디"
          className="field w-48"
          onKeyDown={(e) => e.key === "Enter" && username.trim() && run(username, true)}
        />
        <button onClick={() => run(username, true)} disabled={pending || !username.trim()} className="btn-brand px-4">
          {pending ? "처리 중…" : "지정"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>

      <div className="mt-3 space-y-2">
        {testers.length === 0 && <div className="text-sm text-sub">지정된 테스트 수신자가 없습니다.</div>}
        {testers.map((t) => (
          <div key={t.username} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm">
            <b>{t.name}</b>
            <span className="text-sub">@{t.username}</span>
            <span className="text-xs text-sub">동의 기기 {t.deviceCount}대</span>
            <button onClick={() => run(t.username, false)} disabled={pending} className="ml-auto text-xs text-red-600 hover:underline">
              해제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
