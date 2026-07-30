"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendPushAction } from "./actions";

const SEGMENTS = [
  { key: "all", label: "전체 (앱 설치자 모두)" },
  { key: "members", label: "회원 (로그인 연결)" },
  { key: "guests", label: "비회원 (미로그인)" },
];

export default function PushComposer({ tokenCount }: { tokenCount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [segment, setSegment] = useState("all");

  function send() {
    if (!title.trim() || !body.trim()) {
      setMsg({ ok: false, text: "제목과 내용을 입력하세요." });
      return;
    }
    if (!confirm(`'${SEGMENTS.find((s) => s.key === segment)?.label}' 에게 지금 발송할까요?`)) return;
    setMsg(null);
    start(async () => {
      const r = await sendPushAction({ title, body, url, segment });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setTitle("");
        setBody("");
        setUrl("");
        router.refresh();
      }
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">제목</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="예: 오늘의 골든타임 오픈!" className="field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">대상</span>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="field">
            {SEGMENTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">내용</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={120} placeholder="예: 지금 판매하면 수수료가 올라갑니다. 앱에서 확인하세요." className="field h-20 resize-none" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">탭 시 이동 링크 (선택)</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/timesale · /goods/12345 등" className="field" />
      </label>

      <div className="flex items-center gap-3">
        <button onClick={send} disabled={pending} className="btn-brand px-6">
          {pending ? "발송 중…" : `📤 발송 (대상 ${tokenCount.toLocaleString()})`}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
