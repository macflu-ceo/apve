"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setApplicationStatus, setApplicationMemo, deleteApplication,
  addQuestion, updateQuestion, deleteQuestion,
} from "./actions";

const STATUS = [
  { v: "new", label: "신규" },
  { v: "contacted", label: "연락함" },
  { v: "done", label: "완료" },
  { v: "rejected", label: "보류" },
];

export type App = {
  id: string; name: string; phone: string; job: string | null; region: string | null;
  age: string | null; answers: Record<string, string>; status: string; memo: string | null; createdAt: string;
};
export type Q = { id: string; label: string; type: string; options: string[]; required: boolean; active: boolean; sort: number };

export function ApplicationRow({ a }: { a: App }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [memo, setMemo] = useState(a.memo ?? "");
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[140px]">
          <div className="font-bold">{a.name}</div>
          <div className="text-xs text-sub">{a.phone}</div>
        </div>
        <div className="text-xs text-sub">
          {[a.job, a.region, a.age].filter(Boolean).join(" · ") || "-"}
        </div>
        <span className="text-xs text-sub">{a.createdAt}</span>

        <select
          value={a.status}
          disabled={pending}
          onChange={(e) => start(async () => { await setApplicationStatus(a.id, e.target.value); router.refresh(); })}
          className="ml-auto rounded-md border border-line px-2 py-1 text-xs"
        >
          {STATUS.map((s) => (
            <option key={s.v} value={s.v}>{s.label}</option>
          ))}
        </select>
        <button onClick={() => setOpen(!open)} className="text-xs text-brand underline">
          {open ? "접기" : "상세"}
        </button>
        <button
          onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteApplication(a.id); router.refresh(); }); }}
          className="text-xs text-red-500 hover:underline"
        >
          삭제
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
          {Object.entries(a.answers).length === 0 ? (
            <p className="text-xs text-sub">추가 문항 답변 없음</p>
          ) : (
            Object.entries(a.answers).map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <span className="w-48 shrink-0 text-xs text-sub">{k}</span>
                <span>{v || "-"}</span>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 pt-2">
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => memo !== (a.memo ?? "") && start(async () => { await setApplicationMemo(a.id, memo); router.refresh(); })}
              placeholder="관리자 메모"
              className="field flex-1 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestionManager({ questions }: { questions: Q[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ label: "", type: "text", options: "", required: false });
  const [msg, setMsg] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await addQuestion({
        label: f.label,
        type: f.type,
        options: f.options.split(",").map((s) => s.trim()).filter(Boolean),
        required: f.required,
        sort: questions.length,
      });
      setMsg(r.message);
      if (r.ok) {
        setF({ label: "", type: "text", options: "", required: false });
        router.refresh();
      }
    });
  }

  return (
    <div>
      <form onSubmit={add} className="card mb-4 flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-[220px] flex-1">
          <label className="text-xs text-sub">질문 *</label>
          <input className="field mt-1" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} required placeholder="명품 판매 경험이 있으신가요?" />
        </div>
        <div>
          <label className="text-xs text-sub">유형</label>
          <select className="field mt-1 w-28" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="text">단답</option>
            <option value="textarea">장문</option>
            <option value="select">객관식</option>
          </select>
        </div>
        {f.type === "select" && (
          <div className="min-w-[200px] flex-1">
            <label className="text-xs text-sub">보기 (쉼표 구분)</label>
            <input className="field mt-1" value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} placeholder="없음,1년 미만,3년 이상" />
          </div>
        )}
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={f.required} onChange={(e) => setF({ ...f, required: e.target.checked })} />
          필수
        </label>
        <button className="btn-brand" disabled={pending}>문항 추가</button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </form>

      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="card flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="rounded bg-brandsoft px-2 py-0.5 text-xs font-bold text-brand">
              {q.type === "select" ? "객관식" : q.type === "textarea" ? "장문" : "단답"}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{q.label}</span>
            {q.options.length > 0 && <span className="truncate text-xs text-sub">{q.options.join(" / ")}</span>}
            <button
              onClick={() => start(async () => { await updateQuestion(q.id, { required: !q.required }); router.refresh(); })}
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${q.required ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
            >
              {q.required ? "필수" : "선택"}
            </button>
            <button
              onClick={() => start(async () => { await updateQuestion(q.id, { active: !q.active }); router.refresh(); })}
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${q.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
            >
              {q.active ? "노출" : "숨김"}
            </button>
            <button
              onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteQuestion(q.id); router.refresh(); }); }}
              className="text-xs text-red-500 hover:underline"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
