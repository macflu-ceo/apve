"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { submitReward } from "./rewardActions";

type Sub = { id: string; type: string; status: string; createdAt: string };

const TYPES = [
  { key: "review", label: "리뷰 인증" },
  { key: "promo", label: "홍보 인증" },
];
const STATUS: Record<string, { t: string; c: string }> = {
  pending: { t: "검토중", c: "bg-amber-100 text-amber-700" },
  approved: { t: "승인·20% 지급", c: "bg-emerald-100 text-emerald-700" },
  rejected: { t: "반려", c: "bg-line text-sub" },
};

export default function RewardSubmitBox({ submissions }: { submissions: Sub[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [type, setType] = useState("review");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([""]);

  function setImage(i: number, url: string) {
    setImages((prev) => {
      const next = [...prev];
      next[i] = url;
      if (url && i === next.length - 1 && next.length < 4) next.push("");
      return next;
    });
  }

  function submit() {
    setMsg(null);
    start(async () => {
      const r = await submitReward({ type, content, images: images.filter(Boolean) });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setContent("");
        setImages([""]);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-xl2 border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">⭐ 리뷰·홍보 인증하고 20% 받기</h2>
          <p className="mt-0.5 text-xs text-sub">인증을 제출하면 관리자 확인 후 <b>20% 수수료 바우처</b>를 드려요. (공개되지 않아요)</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-brand shrink-0 px-4 py-2 text-sm">
          {open ? "닫기" : "인증 제출"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 rounded-xl2 bg-white p-4">
          <div className="flex gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  type === t.key ? "border-brand bg-brand text-white" : "border-line text-ink/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="어떻게 리뷰/홍보했는지 간단히 적어주세요"
            className="field h-24 w-full resize-none"
          />
          <div>
            <div className="mb-1 text-sm font-medium">인증 사진 (필수)</div>
            <div className="space-y-3">
              {images.map((img, i) => (
                <div key={i} className="max-w-md">
                  <ImageUploader value={img} onChange={(u) => setImage(i, u)} label={`사진 ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={pending} className="btn-brand px-6">
            {pending ? "제출 중…" : "제출하기"}
          </button>
        </div>
      )}

      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

      {submissions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {submissions.map((s) => {
            const st = STATUS[s.status] ?? { t: s.status, c: "bg-line text-sub" };
            return (
              <li key={s.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                <span className="font-medium">{s.type === "review" ? "리뷰 인증" : "홍보 인증"}</span>
                <span className="text-xs text-sub">{s.createdAt}</span>
                <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${st.c}`}>{st.t}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
