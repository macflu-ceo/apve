"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { sendPushAction, sendTestPushAction, schedulePushAction } from "./actions";

const SEGMENTS = [
  { key: "all", label: "전체 (앱 설치자 모두)" },
  { key: "members", label: "회원 (로그인 연결)" },
  { key: "guests", label: "비회원 (미로그인)" },
  { key: "grade", label: "특정 등급 (예: 매장·관리자)" },
];

export default function PushComposer({ tokenCount, grades }: { tokenCount: number; grades: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [segment, setSegment] = useState("all");
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? "");

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
      const r = await sendPushAction({ title, body, url, imageUrl, segment, gradeId: segment === "grade" ? gradeId : undefined });
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
      const r = await sendTestPushAction({ title, body, url, imageUrl });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  function schedule() {
    if (!validate()) return;
    if (segment === "grade") {
      setMsg({ ok: false, text: "특정 등급 대상은 즉시 발송만 지원해요 (예약 발송 미지원)." });
      return;
    }
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
      {segment === "grade" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">등급 선택</span>
          <select value={gradeId} onChange={(e) => setGradeId(e.target.value)} className="field">
            {grades.length === 0 ? <option value="">(등급 없음 — 등급/수수료율에서 먼저 생성)</option> : grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <span className="text-xs text-sub">이 등급인 회원 중 앱 알림에 동의한 사람에게만 갑니다. (예: 매장·관리자)</span>
        </label>
      )}

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
        <button type="button" onClick={sendTest} disabled={pending} className="btn-line px-4">
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
        <span className="text-xs text-sub">선택한 시각(한국시간)에 발송 예약. (자동발송 크론 연결 필요 — 미연결 시 시각 도래분을 확인 후 수동 처리)</span>
      </div>

      {/* 테스트 발송 안내 */}
      <p className="text-xs text-sub">
        🧪 <b>테스트 발송</b>: 위 제목·내용·이미지 그대로 <b>아래 ‘테스트 수신자’로 지정된 회원의 기기</b>로만 보냅니다.
        등급과 무관 — 이 페이지 하단에서 아이디로 지정하고, 앱에서 알림 동의만 하면 이 버튼으로 테스트가 와요.
      </p>
    </div>
  );
}
