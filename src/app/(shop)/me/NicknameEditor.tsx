"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeNickname } from "@/lib/auth-actions";

export default function NicknameEditor({
  nickname,
  changed,
}: {
  nickname: string | null;
  changed: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMsg(null);
    start(async () => {
      const r = await changeNickname(value);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl2 border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs text-sub">커뮤니티 닉네임</div>
          <div className="mt-0.5 font-bold">
            {nickname ? nickname : <span className="text-sub">미설정</span>}
          </div>
        </div>
        {!changed && !editing && (
          <button onClick={() => setEditing(true)} className="btn-line px-3 py-1.5 text-sm">
            {nickname ? "변경" : "설정"}
          </button>
        )}
        {changed && <span className="text-xs text-sub">변경 완료</span>}
      </div>

      {editing && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={12}
              placeholder="닉네임 (2~12자)"
              className="field flex-1"
            />
            <button onClick={save} disabled={pending} className="btn-brand px-4">
              {pending ? "저장 중…" : "저장"}
            </button>
          </div>
          <p className="mt-1 text-xs text-amber-600">⚠️ 닉네임은 <b>최초 1회만</b> 변경할 수 있어요. 신중히 정해주세요.</p>
        </div>
      )}
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
