"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRule, toggleRule, deleteRule } from "./actions";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  segment: string;
  threshold: number | null;
  message: string;
  active: boolean;
};
type Trigger = { key: string; label: string; desc: string; needsThreshold: boolean; thresholdLabel?: string; vars: string[] };
type Seg = { key: string; label: string; desc: string };

const empty = (): Rule => ({ id: "", name: "", trigger: "sale", segment: "all", threshold: null, message: "", active: true });

export default function RuleManager({
  rules,
  triggers,
  segments,
}: {
  rules: Rule[];
  triggers: Trigger[];
  segments: Seg[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Rule | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const trigMap = Object.fromEntries(triggers.map((t) => [t.key, t]));
  const segMap = Object.fromEntries(segments.map((s) => [s.key, s]));
  const curTrig = editing ? trigMap[editing.trigger] : null;

  function save() {
    if (!editing) return;
    setMsg(null);
    start(async () => {
      const r = await saveRule({
        id: editing.id || undefined,
        name: editing.name,
        trigger: editing.trigger,
        segment: editing.segment,
        threshold: editing.threshold,
        message: editing.message,
        active: editing.active,
      });
      setMsg(r.message);
      if (r.ok) {
        setEditing(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">알림톡 규칙</h2>
        {!editing && (
          <button onClick={() => setEditing(empty())} className="btn-brand px-4 py-2 text-sm">+ 규칙 추가</button>
        )}
      </div>

      {/* 편집 폼 */}
      {editing && (
        <div className="card mb-4 space-y-4 p-5">
          <div className="text-sm font-bold">{editing.id ? "규칙 수정" : "새 규칙"}</div>

          <label className="block">
            <div className="mb-1 text-xs font-semibold text-sub">규칙 이름</div>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="field" placeholder="예: 판매 발생 알림" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-sub">언제 (트리거)</div>
              <select value={editing.trigger} onChange={(e) => setEditing({ ...editing, trigger: e.target.value })} className="field">
                {triggers.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              {curTrig && <p className="mt-1 text-[11px] text-sub">{curTrig.desc}</p>}
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-sub">누구에게 (세그먼트)</div>
              <select value={editing.segment} onChange={(e) => setEditing({ ...editing, segment: e.target.value })} className="field">
                {segments.map((s) => <option key={s.key} value={s.key}>{s.label} — {s.desc}</option>)}
              </select>
            </label>
          </div>

          {curTrig?.needsThreshold && (
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-sub">{curTrig.thresholdLabel ?? "임계값"}</div>
              <input
                type="number"
                value={editing.threshold ?? ""}
                onChange={(e) => setEditing({ ...editing, threshold: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="field w-48"
                placeholder="500000"
              />
            </label>
          )}

          <label className="block">
            <div className="mb-1 text-xs font-semibold text-sub">본문</div>
            <textarea value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} rows={5} className="field font-sans" />
            {curTrig && (
              <p className="mt-1 text-[11px] text-sub">
                사용 가능 변수:{" "}
                {curTrig.vars.map((v) => (
                  <button key={v} type="button" onClick={() => setEditing({ ...editing, message: editing.message + v })} className="mr-1 rounded bg-brandsoft px-1 font-mono text-brand">{v}</button>
                ))}
              </p>
            )}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            활성화
          </label>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={pending} className="btn-brand px-5 py-2">{pending ? "저장 중…" : "저장"}</button>
            <button onClick={() => { setEditing(null); setMsg(null); }} className="btn-line px-4 py-2 text-sm">취소</button>
            {msg && <span className="text-sm text-red-600">{msg}</span>}
          </div>
        </div>
      )}

      {/* 규칙 목록 */}
      <div className="space-y-2">
        {rules.map((r) => {
          const t = trigMap[r.trigger];
          return (
            <div key={r.id} className={`card flex flex-wrap items-center gap-3 p-4 ${r.active ? "" : "opacity-55"}`}>
              <div className="min-w-[180px] flex-1">
                <div className="text-sm font-bold">
                  {r.name}
                  {r.threshold ? <span className="ml-1 text-xs text-brand">({r.threshold.toLocaleString()}원)</span> : null}
                </div>
                <div className="mt-0.5 text-xs text-sub">
                  <span className="rounded bg-brandsoft px-1.5 py-0.5 font-semibold text-brand">{t?.label ?? r.trigger}</span>
                  {" → "}
                  <span className="font-semibold">{segMap[r.segment]?.label ?? r.segment}</span> 세그먼트
                </div>
                <div className="mt-1 line-clamp-1 text-xs text-ink/50">{r.message}</div>
              </div>
              <button
                onClick={() => start(async () => { await toggleRule(r.id, !r.active); router.refresh(); })}
                className={`rounded-full px-3 py-1 text-xs font-bold ${r.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
              >
                {r.active ? "ON" : "OFF"}
              </button>
              <button onClick={() => setEditing(r)} className="text-xs text-brand hover:underline">수정</button>
              <button
                onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteRule(r.id); router.refresh(); }); }}
                className="text-xs text-red-500 hover:underline"
              >삭제</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
