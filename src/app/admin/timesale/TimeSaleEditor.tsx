"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ProductPickerTable, { PickProduct } from "@/components/ProductPickerTable";
import { won } from "@/lib/format";
import { saveTimeSale, openNow, scheduleOpen, endNow } from "./actions";

type Config = {
  title: string;
  upcomingText: string;
  liveText: string;
  baseDiscount: number;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

export default function TimeSaleEditor({
  config,
  products,
  initialItems,
  state,
  refPercent,
}: {
  config: Config;
  products: PickProduct[];
  initialItems: { productId: string; discount: number | null }[];
  state: "off" | "upcoming" | "live";
  refPercent: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState(config.title);
  const [upcomingText, setUpcomingText] = useState(config.upcomingText);
  const [liveText, setLiveText] = useState(config.liveText);
  const [baseDiscount, setBaseDiscount] = useState(String(config.baseDiscount));
  const [active, setActive] = useState(config.active);

  const [selected, setSelected] = useState<string[]>(initialItems.map((i) => i.productId));
  // 상품별 개별 할인율 (""=기본값 사용)
  const [overrides, setOverrides] = useState<Record<string, string>>(
    Object.fromEntries(initialItems.filter((i) => i.discount != null).map((i) => [i.productId, String(i.discount)]))
  );

  // 오픈 컨트롤
  const [openHours, setOpenHours] = useState("3");
  const [schedAt, setSchedAt] = useState("");

  const base = Math.max(0, Math.min(99, parseInt(baseDiscount || "0", 10) || 0));
  const pmap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function itemsPayload() {
    return selected.map((id) => {
      const ov = overrides[id];
      const d = ov === "" || ov === undefined ? null : Math.max(0, Math.min(99, parseInt(ov, 10) || 0));
      return { productId: id, discount: d };
    });
  }

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.message);
      if (r.ok) router.refresh();
    });
  }

  const save = () =>
    run(() => saveTimeSale({ title, upcomingText, liveText, baseDiscount: base, active, items: itemsPayload() }));

  const stateLabel =
    state === "live" ? "🔴 진행중" : state === "upcoming" ? "🟡 오픈 예정 / 대기" : "⚪ 노출 꺼짐";

  const field = "w-full rounded-md border border-line px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      {/* 상태 + 오픈 컨트롤 */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold">현재 상태 <span className="ml-2 font-black">{stateLabel}</span></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            배너 노출
          </label>
        </div>
        {config.startAt && (
          <p className="mb-3 text-xs text-sub">
            오픈 {new Date(config.startAt).toLocaleString("ko-KR")} ~ 종료 {config.endAt ? new Date(config.endAt).toLocaleString("ko-KR") : "-"}
          </p>
        )}

        <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <div className="flex items-end gap-2">
            <label className="text-sm">
              <div className="mb-1 text-xs text-sub">지금 오픈 (시간)</div>
              <input value={openHours} onChange={(e) => setOpenHours(e.target.value)} className="w-24 rounded-md border border-line px-3 py-2 text-sm" inputMode="decimal" />
            </label>
            <button
              onClick={() => run(() => openNow(parseFloat(openHours) || 3))}
              disabled={pending}
              className="btn-brand px-4 py-2 text-sm"
            >
              ▶ 지금 오픈
            </button>
          </div>

          <div className="flex items-end gap-2">
            <label className="text-sm">
              <div className="mb-1 text-xs text-sub">예약 오픈 (시작 시각)</div>
              <input type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm" />
            </label>
            <button
              onClick={() => run(() => scheduleOpen(new Date(schedAt).toISOString(), parseFloat(openHours) || 3))}
              disabled={pending || !schedAt}
              className="btn-line px-4 py-2 text-sm disabled:opacity-40"
            >
              ⏰ 예약
            </button>
          </div>

          {state !== "off" && (
            <button onClick={() => run(endNow)} disabled={pending} className="ml-auto text-sm text-red-500 hover:underline">
              즉시 종료
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-sub">
          예약 오픈 시각까지는 소비자에게 <b>“{upcomingText}”</b> + 오픈 카운트다운이 노출됩니다. 예약도 위 “지금 오픈 (시간)” 값을 진행시간으로 사용합니다.
        </p>
      </div>

      {/* 문구·기본 할인 */}
      <div className="card space-y-3 p-5">
        <div className="text-sm font-bold">배너 설정</div>
        <label className="block text-sm">
          <div className="mb-1 text-xs text-sub">타이틀</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <div className="mb-1 text-xs text-sub">오픈 예정 문구</div>
            <input value={upcomingText} onChange={(e) => setUpcomingText(e.target.value)} className={field} />
          </label>
          <label className="block text-sm">
            <div className="mb-1 text-xs text-sub">진행중 문구</div>
            <input value={liveText} onChange={(e) => setLiveText(e.target.value)} className={field} />
          </label>
        </div>
        <label className="block text-sm">
          <div className="mb-1 text-xs text-sub">기본 추가 할인율 (%) — 상품별 개별값이 없으면 이 값 적용</div>
          <input value={baseDiscount} onChange={(e) => setBaseDiscount(e.target.value)} className="w-32 rounded-md border border-line px-3 py-2 text-sm" inputMode="numeric" />
        </label>
        <p className="text-xs text-amber-600">
          ⚠️ 여기 할인율은 <b>우리 플랫폼 표시용</b>입니다. 실제 결제는 고도몰에서 이뤄지므로, 같은 기간 <b>고도몰에도 동일 할인</b>을 적용하세요.
        </p>
      </div>

      {/* 상품 선택 */}
      <div className="card p-5">
        <div className="mb-2 text-sm font-bold">상품 선택 ({selected.length}개)</div>
        <ProductPickerTable products={products} selected={selected} onChange={setSelected} refPercent={refPercent} />
      </div>

      {/* 선택 상품별 할인 */}
      {selected.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 text-sm font-bold">선택 상품별 할인율</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line text-left text-xs text-sub">
                <tr>
                  <th className="py-2">상품</th>
                  <th className="text-right">공급가</th>
                  <th className="w-40 text-center">추가 할인율(%)</th>
                  <th className="text-right">세일가</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => {
                  const p = pmap.get(id);
                  if (!p) return null;
                  const ov = overrides[id] ?? "";
                  const eff = ov === "" ? base : Math.max(0, Math.min(99, parseInt(ov, 10) || 0));
                  const deal = p.salePrice != null ? Math.round((p.salePrice * (100 - eff)) / 100) : null;
                  return (
                    <tr key={id} className="border-b border-line">
                      <td className="max-w-[260px] truncate py-2">{p.name}</td>
                      <td className="text-right text-sub">{won(p.salePrice)}</td>
                      <td className="text-center">
                        <input
                          value={ov}
                          onChange={(e) => setOverrides({ ...overrides, [id]: e.target.value })}
                          placeholder={`기본 ${base}`}
                          className="w-24 rounded-md border border-line px-2 py-1.5 text-center text-sm"
                          inputMode="numeric"
                        />
                      </td>
                      <td className="text-right font-bold text-[#e5322f]">
                        {won(deal)} <span className="text-[10px] font-normal text-sub">({eff}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-sub">비워두면 기본 할인율({base}%)이 적용됩니다.</p>
        </div>
      )}

      {/* 저장 */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className="btn-brand px-6 py-2.5">
          {pending ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-brand">{msg}</span>}
      </div>
    </div>
  );
}
