"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { createPopup, updatePopup, deletePopup } from "./actions";

type Popup = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  sort: number;
  platform: string; // all | web | app
  startAt: string | null; // YYYY-MM-DDTHH:mm (local) or null
  endAt: string | null;
};

const PLATFORMS = [
  { key: "all", label: "웹+앱 모두" },
  { key: "web", label: "웹에서만" },
  { key: "app", label: "앱에서만" },
];

// ISO → datetime-local 값
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTime() - d.getTimezoneOffset() * 60000;
  return new Date(off).toISOString().slice(0, 16);
}

export default function PopupManager({ popups }: { popups: Popup[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  // 새 팝업
  const [nImg, setNImg] = useState("");
  const [nTitle, setNTitle] = useState("");
  const [nLink, setNLink] = useState("");
  const [nPlatform, setNPlatform] = useState("all");
  const [nStart, setNStart] = useState("");
  const [nEnd, setNEnd] = useState("");

  function add() {
    setMsg(null);
    start(async () => {
      const r = await createPopup({ title: nTitle, imageUrl: nImg, linkUrl: nLink, platform: nPlatform, startAt: nStart, endAt: nEnd });
      setMsg(r.message);
      if (r.ok) {
        setNImg(""); setNTitle(""); setNLink(""); setNPlatform("all"); setNStart(""); setNEnd("");
        router.refresh();
      }
    });
  }

  const field = "rounded-md border border-line px-3 py-2 text-sm";

  return (
    <div className="space-y-8">
      {/* 새 팝업 추가 */}
      <div className="card p-5">
        <div className="mb-3 text-sm font-bold">새 팝업 추가</div>
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div>
            <div className="mb-1 text-xs text-sub">이미지 *</div>
            <ImageUploader value={nImg} onChange={setNImg} />
          </div>
          <div className="space-y-3">
            <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="관리용 제목 (예: 신규가입 이벤트)" className={`${field} w-full`} />
            <input value={nLink} onChange={(e) => setNLink(e.target.value)} placeholder="클릭 시 이동할 링크 (선택, 예: /timesale)" className={`${field} w-full`} />
            <label className="text-sm">
              <div className="mb-1 text-xs text-sub">노출 대상</div>
              <select value={nPlatform} onChange={(e) => setNPlatform(e.target.value)} className={field}>
                {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="text-sm">
                <div className="mb-1 text-xs text-sub">노출 시작 (선택)</div>
                <input type="datetime-local" value={nStart} onChange={(e) => setNStart(e.target.value)} className={field} />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-xs text-sub">노출 종료 (선택)</div>
                <input type="datetime-local" value={nEnd} onChange={(e) => setNEnd(e.target.value)} className={field} />
              </label>
            </div>
            <button onClick={add} disabled={pending || !nImg} className="btn-brand px-5 py-2 text-sm disabled:opacity-40">
              {pending ? "추가 중…" : "팝업 추가"}
            </button>
            {msg && <span className="ml-3 text-sm text-brand">{msg}</span>}
          </div>
        </div>
        <p className="mt-2 text-xs text-sub">노출 기간을 비우면 상시 노출됩니다. 소비자 화면 가운데에 뜨고, 여러 개면 넘겨볼 수 있어요.</p>
      </div>

      {/* 등록된 팝업 */}
      <div>
        <div className="mb-3 text-sm font-bold">등록된 팝업 ({popups.length})</div>
        {popups.length === 0 ? (
          <div className="card p-6 text-sm text-sub">등록된 팝업이 없습니다.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {popups.map((p) => (
              <PopupRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PopupRow({ p }: { p: Popup }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(p.title);
  const [link, setLink] = useState(p.linkUrl ?? "");
  const [active, setActive] = useState(p.active);
  const [sort, setSort] = useState(String(p.sort));
  const [platform, setPlatform] = useState(p.platform);
  const [startAt, setStartAt] = useState(toLocalInput(p.startAt));
  const [endAt, setEndAt] = useState(toLocalInput(p.endAt));

  const save = () =>
    start(async () => {
      await updatePopup(p.id, { title, linkUrl: link, active, sort: parseInt(sort, 10) || 0, platform, startAt, endAt });
      router.refresh();
    });
  const remove = () => {
    if (!confirm("이 팝업을 삭제할까요?")) return;
    start(async () => {
      await deletePopup(p.id);
      router.refresh();
    });
  };

  const field = "rounded-md border border-line px-2 py-1.5 text-sm";

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} alt="" className="h-28 w-24 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} w-full`} placeholder="제목" />
          <input value={link} onChange={(e) => setLink(e.target.value)} className={`${field} w-full`} placeholder="링크(선택)" />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> 노출
            </label>
            <label className="flex items-center gap-1">
              순서 <input value={sort} onChange={(e) => setSort(e.target.value)} className="w-14 rounded border border-line px-2 py-1" inputMode="numeric" />
            </label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded border border-line px-1.5 py-1">
              {PLATFORMS.map((pf) => <option key={pf.key} value={pf.key}>{pf.label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-sub">
            <label>시작 <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="rounded border border-line px-1 py-0.5" /></label>
            <label>종료 <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="rounded border border-line px-1 py-0.5" /></label>
          </div>
        </div>
      </div>
      <div className="flex border-t border-line text-sm">
        <button onClick={save} disabled={pending} className="flex-1 py-2 font-semibold text-brand hover:bg-black/[0.03]">저장</button>
        <div className="w-px bg-line" />
        <button onClick={remove} disabled={pending} className="flex-1 py-2 text-red-500 hover:bg-red-50">삭제</button>
      </div>
    </div>
  );
}
