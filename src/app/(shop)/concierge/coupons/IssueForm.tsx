"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCoupon } from "./actions";

const BENEFIT_PRESETS = ["정가 대비 최대 70% 전용가", "정가 대비 최대 50% 전용가", "시즌 신상 특별 전용가"];
const today = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const plus = (d: number) => new Date(Date.now() + (9 * 3600 + d * 86400) * 1000).toISOString().slice(0, 10);

export default function IssueForm({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ id: string; code: string } | null>(null);
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    storeId: stores[0]?.id ?? "",
    priceType: "cp" as "cp" | "ws",
    customerName: "",
    customerPhone: "",
    benefitText: BENEFIT_PRESETS[0],
    brandsText: "",
    conditions: "기명 발급 · 본인만 사용 가능\n동반 1인까지 적용\n1회 사용 후 소멸\n일부 한정 품목 제외",
    startAt: today(),
    endAt: plus(30),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = done ? `${origin}/coupon/${done.id}` : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    start(async () => {
      const r = await createCoupon(f);
      if (r.ok) {
        setDone({ id: r.id, code: r.code });
        router.refresh();
      } else setErr(r.message);
    });
  }

  if (done)
    return (
      <div className="space-y-3">
        <div className="rounded-xl2 bg-emerald-50 p-4 text-sm ring-1 ring-emerald-200">
          <div className="font-bold text-emerald-700">발급 완료 · 코드 {done.code}</div>
          <p className="mt-1 text-ink/70">아래 링크를 고객에게 카톡으로 보내세요.</p>
        </div>
        <div className="flex gap-2">
          <input readOnly value={link} className="field flex-1 text-xs" onFocus={(e) => e.target.select()} />
          <button onClick={() => navigator.clipboard.writeText(link)} className="rounded-lg bg-ink px-4 text-sm font-bold text-white">복사</button>
        </div>
        <div className="flex gap-2">
          <a href={link} target="_blank" className="btn-line flex-1 rounded-lg py-2.5 text-center text-sm font-semibold">고객 화면 보기</a>
          <button onClick={() => setDone(null)} className="btn-primary flex-1 rounded-lg py-2.5 text-sm font-bold">새로 발급</button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-sub">매장</span>
          <select value={f.storeId} onChange={(e) => set("storeId", e.target.value)} className="field mt-1 w-full">
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-sub">가격 구분</span>
          <select value={f.priceType} onChange={(e) => set("priceType", e.target.value as "cp" | "ws")} className="field mt-1 w-full">
            <option value="cp">cp · 마진 있음</option>
            <option value="ws">ws · 마진 없음</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="text-xs text-sub">고객 이름 *</span><input className="field mt-1 w-full" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} /></label>
        <label className="block"><span className="text-xs text-sub">고객 연락처 *</span><input className="field mt-1 w-full" value={f.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} placeholder="01012345678" /></label>
      </div>
      <div>
        <span className="text-xs text-sub">적용 혜택 *</span>
        <div className="mb-1 mt-1 flex flex-wrap gap-1">
          {BENEFIT_PRESETS.map((b) => (
            <button type="button" key={b} onClick={() => set("benefitText", b)} className={`rounded-full px-2.5 py-1 text-xs ${f.benefitText === b ? "bg-brand text-white" : "bg-brandsoft text-ink"}`}>{b}</button>
          ))}
        </div>
        <input className="field w-full" value={f.benefitText} onChange={(e) => set("benefitText", e.target.value)} />
      </div>
      <label className="block"><span className="text-xs text-sub">적용 브랜드·상품 (선택)</span><input className="field mt-1 w-full" value={f.brandsText} onChange={(e) => set("brandsText", e.target.value)} placeholder="구찌 · 프라다 전 품목" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="text-xs text-sub">시작일</span><input type="date" className="field mt-1 w-full" value={f.startAt} onChange={(e) => set("startAt", e.target.value)} /></label>
        <label className="block"><span className="text-xs text-sub">종료일</span><input type="date" className="field mt-1 w-full" value={f.endAt} onChange={(e) => set("endAt", e.target.value)} /></label>
      </div>
      <label className="block"><span className="text-xs text-sub">이용 조건 (한 줄 = 한 항목)</span><textarea rows={4} className="field mt-1 w-full" value={f.conditions} onChange={(e) => set("conditions", e.target.value)} /></label>
      {err && <div className="text-sm text-red-500">{err}</div>}
      <button disabled={pending} className="btn-primary w-full rounded-lg py-3 text-sm font-bold disabled:opacity-50">{pending ? "발급 중…" : "특별 이용 권한 발급"}</button>
    </form>
  );
}
