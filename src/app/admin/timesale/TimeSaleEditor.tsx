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
  baseBoost: number;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
  colorFrom: string;
  colorTo: string;
};

const COLOR_PRESETS: { label: string; from: string; to: string }[] = [
  { label: "레드", from: "#e5322f", to: "#c81e1a" },
  { label: "골드", from: "#b8860b", to: "#4A60FF" },
  { label: "퍼플", from: "#7c3aed", to: "#5b21b6" },
  { label: "블루", from: "#2563eb", to: "#1e40af" },
  { label: "핑크", from: "#ec4899", to: "#be185d" },
  { label: "블랙", from: "#2b2622", to: "#4a3f36" },
];

export default function TimeSaleEditor({
  config,
  products,
  initialItems,
  state,
  refPercent,
}: {
  config: Config;
  products: PickProduct[];
  initialItems: { productId: string; boost: number | null }[];
  state: "off" | "upcoming" | "live";
  refPercent: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState(config.title);
  const [upcomingText, setUpcomingText] = useState(config.upcomingText);
  const [liveText, setLiveText] = useState(config.liveText);
  const [baseBoost, setBaseBoost] = useState(String(config.baseBoost));
  const [active, setActive] = useState(config.active);
  const [colorFrom, setColorFrom] = useState(config.colorFrom);
  const [colorTo, setColorTo] = useState(config.colorTo);

  const [selected, setSelected] = useState<string[]>(initialItems.map((i) => i.productId));
  const [overrides, setOverrides] = useState<Record<string, string>>(
    Object.fromEntries(initialItems.filter((i) => i.boost != null).map((i) => [i.productId, String(i.boost)]))
  );

  const [openHours, setOpenHours] = useState("3");
  const [schedAt, setSchedAt] = useState("");

  const base = Math.max(0, Math.min(90, parseInt(baseBoost || "0", 10) || 0));
  const pmap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function itemsPayload() {
    return selected.map((id) => {
      const ov = overrides[id];
      const b = ov === "" || ov === undefined ? null : Math.max(0, Math.min(90, parseInt(ov, 10) || 0));
      return { productId: id, boost: b };
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
    run(() =>
      saveTimeSale({ title, upcomingText, liveText, baseBoost: base, active, colorFrom, colorTo, items: itemsPayload() })
    );

  const stateLabel =
    state === "live" ? "🟢 진행중" : state === "upcoming" ? "🟡 오픈 예정 / 대기" : "⚪ 노출 꺼짐";

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
            <button onClick={() => run(() => openNow(parseFloat(openHours) || 3))} disabled={pending} className="btn-brand px-4 py-2 text-sm">
              ▶ 지금 오픈
            </button>
          </div>

          <div className="flex items-end gap-2">
            <label className="text-sm">
              <div className="mb-1 text-xs text-sub">예약 오픈 (시작 시각)</div>
              <input type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm" />
            </label>
            <button onClick={() => run(() => scheduleOpen(new Date(schedAt).toISOString(), parseFloat(openHours) || 3))} disabled={pending || !schedAt} className="btn-line px-4 py-2 text-sm disabled:opacity-40">
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
          <b>오픈/예약 시 현재 설정이 이력으로 저장</b>되어, 그 기간에 발생한 판매는 정산 때 부스트가 정확히 적용됩니다. 오픈 후 상품·부스트를 바꾸면 다시 오픈해야 이력에 반영돼요.
        </p>
      </div>

      {/* 문구·기본 부스트 */}
      <div className="card space-y-3 p-5">
        <div className="text-sm font-bold">배너 설정</div>
        <label className="block text-sm">
          <div className="mb-1 text-xs text-sub">타이틀 (예: 🔥 골든타임 / 마진업 타임)</div>
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
          <div className="mb-1 text-xs text-sub">기본 추가 수수료율 (%p) — 상품별 개별값이 없으면 이 값 적용</div>
          <input value={baseBoost} onChange={(e) => setBaseBoost(e.target.value)} className="w-32 rounded-md border border-line px-3 py-2 text-sm" inputMode="numeric" />
        </label>
        <p className="text-xs text-sub">
          예) 기본 등급 수수료율이 13%인데 부스트 +5%p면, 이 상품을 골든타임에 팔면 <b>18%</b>가 적용됩니다.
        </p>

        {/* 배너 색상 */}
        <div className="border-t border-line pt-3">
          <div className="mb-2 text-xs font-semibold text-sub">진행중 배너 색상</div>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((c) => {
              const on = colorFrom === c.from && colorTo === c.to;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => { setColorFrom(c.from); setColorTo(c.to); }}
                  className={`h-8 w-8 rounded-full ring-offset-2 ${on ? "ring-2 ring-ink" : ""}`}
                  style={{ backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                  title={c.label}
                  aria-label={c.label}
                />
              );
            })}
            <span className="mx-1 text-xs text-sub">직접</span>
            <input type="color" value={colorFrom} onChange={(e) => setColorFrom(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-line" title="시작색" />
            <input type="color" value={colorTo} onChange={(e) => setColorTo(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-line" title="끝색" />
          </div>
          {/* 미리보기 */}
          <div
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-white"
            style={{ backgroundImage: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
          >
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black" style={{ color: colorTo }}>LIVE</span>
            <span className="text-sm font-black">{title || "🔥 골든타임"}</span>
            {base > 0 && <span className="rounded bg-white px-1.5 py-0.5 text-xs font-black" style={{ color: colorTo }}>수수료 +{base}%p</span>}
          </div>
        </div>
      </div>

      {/* 상품 선택 */}
      <div className="card p-5">
        <div className="mb-2 text-sm font-bold">상품 선택 ({selected.length}개)</div>
        <ProductPickerTable products={products} selected={selected} onChange={setSelected} refPercent={refPercent} />
      </div>

      {/* 선택 상품별 부스트 */}
      {selected.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 text-sm font-bold">선택 상품별 추가 수수료율</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-line text-left text-xs text-sub">
                <tr>
                  <th className="py-2">상품</th>
                  <th className="text-right">공급가</th>
                  <th className="w-40 text-center">추가 수수료(%p)</th>
                  <th className="text-right">수수료 (기준 {refPercent}% → 적용)</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => {
                  const p = pmap.get(id);
                  if (!p) return null;
                  const ov = overrides[id] ?? "";
                  const eff = ov === "" ? base : Math.max(0, Math.min(90, parseInt(ov, 10) || 0));
                  const boostedRate = refPercent + eff;
                  const boosted = p.salePrice != null ? Math.round((p.salePrice * boostedRate) / 100) : null;
                  const baseComm = p.salePrice != null ? Math.round((p.salePrice * refPercent) / 100) : null;
                  return (
                    <tr key={id} className="border-b border-line">
                      <td className="max-w-[240px] truncate py-2">{p.name}</td>
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
                      <td className="text-right">
                        {baseComm != null && eff > 0 && <span className="text-sub line-through">{won(baseComm)}</span>}{" "}
                        <b className="text-[#4A60FF]">{won(boosted)}</b>{" "}
                        <span className="text-[10px] text-sub">({boostedRate}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-sub">비워두면 기본 부스트(+{base}%p)가 적용됩니다.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className="btn-brand px-6 py-2.5">
          {pending ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-brand">{msg}</span>}
      </div>
    </div>
  );
}
