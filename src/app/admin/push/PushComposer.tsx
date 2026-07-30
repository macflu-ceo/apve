"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { sendPushAction, sendTestPushAction, schedulePushAction } from "./actions";

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
  const [imageUrl, setImageUrl] = useState("");
  const [segment, setSegment] = useState("all");

  const [showTest, setShowTest] = useState(false);
  const [testToken, setTestToken] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  function validate() {
    if (!title.trim() || !body.trim()) {
      setMsg({ ok: false, text: "제목과 내용을 입력하세요." });
      return false;
    }
    return true;
  }

  function send() {
    if (!validate()) return;
    if (!confirm(`'${SEGMENTS.find((s) => s.key === segment)?.label}' 에게 지금 발송할까요?`)) return;
    setMsg(null);
    start(async () => {
      const r = await sendPushAction({ title, body, url, imageUrl, segment });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setTitle("");
        setBody("");
        setUrl("");
        setImageUrl("");
        router.refresh();
      }
    });
  }

  function sendTest() {
    if (!validate()) return;
    setMsg(null);
    start(async () => {
      const r = await sendTestPushAction({ token: testToken, title, body, url, imageUrl });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  function schedule() {
    if (!validate()) return;
    if (!scheduleAt) {
      setMsg({ ok: false, text: "예약 시각을 선택하세요." });
      return;
    }
    setMsg(null);
    start(async () => {
      const r = await schedulePushAction({ title, body, url, imageUrl, segment, sendAt: scheduleAt });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setTitle("");
        setBody("");
        setUrl("");
        setImageUrl("");
        setScheduleAt("");
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

      {/* 이미지 첨부 */}
      <div>
        <span className="text-sm font-medium">이미지 (선택)</span>
        <p className="mb-2 text-xs text-sub">
          알림에 큰 이미지를 넣습니다. <b>가로형 권장(2:1, 예: 1200×600)</b> · 안드로이드는 펼치면 크게, iOS는 눌러서 확대됩니다.
        </p>
        <input type="hidden" value={imageUrl} readOnly />
        <div className="max-w-sm">
          <ImageUploader value={imageUrl} onChange={setImageUrl} label="푸시 이미지" />
        </div>
        {imageUrl && (
          <button type="button" onClick={() => setImageUrl("")} className="mt-1 text-xs text-red-500 hover:underline">
            이미지 제거
          </button>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">탭 시 이동 링크 (선택)</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/timesale · /goods/12345 등" className="field" />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={send} disabled={pending} className="btn-brand px-6">
          {pending ? "처리 중…" : `📤 지금 발송 (대상 ${tokenCount.toLocaleString()})`}
        </button>
        <button type="button" onClick={() => setShowTest((v) => !v)} className="btn-line px-4">
          🧪 테스트 발송
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>

      {/* 예약 발송 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl2 border border-line bg-[#fbfaf9] p-3">
        <span className="text-sm font-medium">⏰ 예약 발송</span>
        <input
          type="datetime-local"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
          className="field w-56"
        />
        <button onClick={schedule} disabled={pending || !scheduleAt} className="btn-line px-4">
          예약 등록
        </button>
        <span className="text-xs text-sub">선택한 시각(한국시간)에 자동 발송됩니다.</span>
      </div>

      {/* 테스트 발송 (내 기기 1대에만) */}
      {showTest && (
        <div className="rounded-xl2 border border-dashed border-line bg-[#fbfaf9] p-4">
          <div className="mb-1 text-sm font-bold">🧪 테스트 발송 — 내 기기에만</div>
          <p className="mb-3 text-xs text-sub">
            전체에 쏘기 전에 <b>내 기기 1대</b>로 먼저 확인합니다. 위의 제목·내용·이미지 그대로 이 기기에만 갑니다.
            <br />
            내 기기의 <b>푸시 토큰</b>을 붙여넣으세요. (토큰 얻는 법은 아래 안내 참고)
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={testToken}
              onChange={(e) => setTestToken(e.target.value)}
              placeholder="내 기기 FCM 토큰 붙여넣기"
              className="field flex-1 min-w-[240px] font-mono text-xs"
            />
            <button onClick={sendTest} disabled={pending || !testToken.trim()} className="btn-brand px-5">
              {pending ? "발송 중…" : "이 기기로 테스트"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
