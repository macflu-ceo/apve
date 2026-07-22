"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGrade, updateGrade, deleteGrade } from "./actions";

type G = { id: string; name: string; percent: number; sort: number; systemKey: string | null; count: number };

export default function GradeManager({ grades }: { grades: G[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [nw, setNw] = useState({ name: "", percent: "10", sort: "9" });

  function add(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await createGrade(nw.name, Number(nw.percent), Number(nw.sort));
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setNw({ name: "", percent: "10", sort: "9" });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 등급 추가 */}
      <form onSubmit={add} className="card flex flex-wrap items-end gap-3 p-5">
        <div>
          <label className="text-xs text-sub">등급명 *</label>
          <input className="field mt-1 w-40" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} placeholder="VIP" required />
        </div>
        <div>
          <label className="text-xs text-sub">수수료율(%)</label>
          <input type="number" step={0.5} min={0} className="field mt-1 w-28" value={nw.percent} onChange={(e) => setNw({ ...nw, percent: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-sub">순서</label>
          <input type="number" className="field mt-1 w-20" value={nw.sort} onChange={(e) => setNw({ ...nw, sort: e.target.value })} />
        </div>
        <button className="btn-brand" disabled={pending}>등급 추가</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>}
      </form>

      {/* 등급 목록 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-sub">
            <tr>
              <th className="py-2">등급명</th>
              <th className="w-32">수수료율(%)</th>
              <th className="w-24">순서</th>
              <th className="w-32">자동 적용</th>
              <th className="w-24">회원수</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <GradeRow key={g.id} g={g} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-sub">
        · <b>첫구매</b>는 판매실적 0건일 때, <b>일반</b>은 1건부터 자동으로 적용됩니다. (삭제 불가)
        <br />· 그 외 등급(컨시어지 등)은 <b>회원(파트너) 관리</b>에서 회원별로 직접 지정합니다.
      </p>
    </div>
  );
}

function GradeRow({ g }: { g: G }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(g.name);
  const [percent, setPercent] = useState(String(g.percent));
  const [sort, setSort] = useState(String(g.sort));
  const [saved, setSaved] = useState(false);

  function save() {
    if (name === g.name && Number(percent) === g.percent && Number(sort) === g.sort) return;
    start(async () => {
      await updateGrade(g.id, { name, percent: Number(percent), sort: Number(sort) });
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-line">
      <td className="py-2">
        <input className="w-40 rounded-md border border-line px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} onBlur={save} />
        {saved && <span className="ml-2 text-xs text-green-700">저장됨</span>}
      </td>
      <td>
        <input type="number" step={0.5} min={0} className="w-24 rounded-md border border-line px-2 py-1" value={percent} onChange={(e) => setPercent(e.target.value)} onBlur={save} />
      </td>
      <td>
        <input type="number" className="w-16 rounded-md border border-line px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value)} onBlur={save} />
      </td>
      <td className="text-xs text-sub">
        {g.systemKey === "first" ? "실적 0건" : g.systemKey === "normal" ? "실적 1건~" : "수동 지정"}
      </td>
      <td>{g.count}명</td>
      <td>
        {!g.systemKey && (
          <button
            onClick={() => { if (confirm(`'${g.name}' 등급을 삭제할까요?`)) start(async () => { await deleteGrade(g.id); router.refresh(); }); }}
            disabled={pending}
            className="text-xs text-red-500 hover:underline"
          >
            삭제
          </button>
        )}
      </td>
    </tr>
  );
}
