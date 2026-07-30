"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { createSlide, updateSlide, deleteSlide } from "./actions";

type Slide = { id: string; imageUrl: string; caption: string | null; active: boolean; sort: number };

export default function OnboardingManager({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  // 새 슬라이드 입력
  const [newImg, setNewImg] = useState("");
  const [newCap, setNewCap] = useState("");

  function run(fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.message);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* 추가 */}
      <div className="card p-5">
        <div className="mb-3 text-sm font-bold">새 슬라이드 추가</div>
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div>
            <input type="hidden" value={newImg} readOnly />
            <ImageUploader value={newImg} onChange={setNewImg} label="이미지 (세로형 권장)" />
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              value={newCap}
              onChange={(e) => setNewCap(e.target.value)}
              placeholder="설명 문구 (선택) — 예: 코드 하나로 명품을 판매하고 수수료를 받으세요"
              className="field h-24 resize-none"
            />
            <button
              className="btn-brand w-fit px-5"
              disabled={pending || !newImg}
              onClick={() =>
                run(
                  () => createSlide({ imageUrl: newImg, caption: newCap }),
                  () => {
                    setNewImg("");
                    setNewCap("");
                  }
                )
              }
            >
              {pending ? "처리 중…" : "추가"}
            </button>
          </div>
        </div>
      </div>

      {msg && <div className="text-sm text-green-700">{msg}</div>}

      {/* 목록 */}
      {slides.length === 0 ? (
        <div className="card p-6 text-sm text-sub">등록된 슬라이드가 없습니다. 위에서 추가하세요.</div>
      ) : (
        <div className="space-y-3">
          {slides.map((s) => (
            <SlideRow key={s.id} s={s} pending={pending} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideRow({
  s,
  pending,
  run,
}: {
  s: Slide;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) => void;
}) {
  const [caption, setCaption] = useState(s.caption ?? "");
  const [sort, setSort] = useState(s.sort);

  return (
    <div className="card flex flex-wrap items-center gap-4 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.imageUrl} alt="" className="h-24 w-20 shrink-0 rounded-lg object-cover" />
      <div className="flex-1 space-y-2">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="설명 문구 (선택)"
          className="field h-16 w-full resize-none text-sm"
        />
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1">
            순서
            <input
              type="number"
              value={sort}
              onChange={(e) => setSort(Number(e.target.value))}
              className="field w-20"
            />
          </label>
          <span className={`rounded-full px-2 py-0.5 text-xs ${s.active ? "bg-green-100 text-green-700" : "bg-line text-sub"}`}>
            {s.active ? "노출중" : "숨김"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button
          className="btn-line px-3 py-1.5 text-sm"
          disabled={pending}
          onClick={() => run(() => updateSlide(s.id, { caption, active: s.active, sort }))}
        >
          저장
        </button>
        <button
          className="btn-line px-3 py-1.5 text-sm"
          disabled={pending}
          onClick={() => run(() => updateSlide(s.id, { caption, active: !s.active, sort }))}
        >
          {s.active ? "숨기기" : "노출"}
        </button>
        <button
          className="px-3 py-1.5 text-sm text-red-500 hover:underline"
          disabled={pending}
          onClick={() => {
            if (confirm("이 슬라이드를 삭제할까요?")) run(() => deleteSlide(s.id));
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
