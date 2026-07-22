"use client";

import { useState, useTransition } from "react";
import { submitConciergeApplication } from "./actions";

export type Question = {
  id: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
};

export default function ApplyModal({ questions }: { questions: Question[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", phone: "", job: "", region: "", age: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await submitConciergeApplication({ ...f, answers });
      setMsg(r.message);
      if (r.ok) setDone(true);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-brand mt-4 w-full">
        컨시어지 가입 신청하기
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 md:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-6 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black">컨시어지 가입 신청</h2>
                <p className="mt-1 text-xs text-sub">간단한 정보를 남겨주시면 담당자가 연락드립니다.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-2xl leading-none text-sub">×</button>
            </div>

            {done ? (
              <div className="py-10 text-center">
                <div className="text-lg font-bold text-brand">신청이 접수되었습니다 🎉</div>
                <p className="mt-2 text-sm text-sub">담당자가 곧 연락드릴게요.</p>
                <button onClick={() => setOpen(false)} className="btn-line mt-6 w-full">닫기</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-sub">이름 *</label>
                    <input className="field mt-1" value={f.name} onChange={(e) => set("name", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs text-sub">전화번호 *</label>
                    <input className="field mt-1" value={f.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="010-0000-0000" />
                  </div>
                  <div>
                    <label className="text-xs text-sub">직업</label>
                    <input className="field mt-1" value={f.job} onChange={(e) => set("job", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-sub">지역</label>
                    <input className="field mt-1" value={f.region} onChange={(e) => set("region", e.target.value)} placeholder="서울 강남구" />
                  </div>
                  <div>
                    <label className="text-xs text-sub">나이</label>
                    <input className="field mt-1" value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="30대" />
                  </div>
                </div>

                {/* 커스텀 문항 */}
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="text-xs text-sub">
                      {q.label} {q.required && "*"}
                    </label>
                    {q.type === "select" ? (
                      <select
                        className="field mt-1"
                        required={q.required}
                        value={answers[q.label] ?? ""}
                        onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                      >
                        <option value="">선택해주세요</option>
                        {q.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : q.type === "textarea" ? (
                      <textarea
                        className="field mt-1 min-h-[90px]"
                        required={q.required}
                        value={answers[q.label] ?? ""}
                        onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                      />
                    ) : (
                      <input
                        className="field mt-1"
                        required={q.required}
                        value={answers[q.label] ?? ""}
                        onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                      />
                    )}
                  </div>
                ))}

                <button className="btn-brand w-full" disabled={pending}>
                  {pending ? "접수 중…" : "신청하기"}
                </button>
                {msg && !done && <p className="text-center text-sm text-red-600">{msg}</p>}
                <p className="text-center text-[11px] text-sub">
                  신청 시 상담 목적의 개인정보 수집·이용에 동의하는 것으로 간주합니다.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
