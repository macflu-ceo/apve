"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

const CHOICES = {
  gender: ["남성", "여성"],
  age: ["20대", "30대", "40대", "50대"],
  background: ["스튜디오(화이트)", "거리", "카페", "호텔 로비", "야외"],
  shot: ["제품 클로즈업", "모델 착용컷(전신)", "모델 착용컷(상반신)"],
};

function Chips({
  label, options, value, onChange, disabled,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="mb-1.5 text-xs font-semibold text-sub">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              value === o ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/70 hover:border-ink/30"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AiImageStudio({ goodsNo }: { goodsNo: string }) {
  const { open } = useAuthModal();
  const router = useRouter();
  const [panel, setPanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [img, setImg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [opt, setOpt] = useState({
    gender: "여성",
    age: "30대",
    background: "스튜디오(화이트)",
    shot: "모델 착용컷(전신)",
  });
  const isCloseUp = opt.shot === "제품 클로즈업";

  async function generate(save: boolean) {
    setBusy(true);
    setErr(null);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goodsNo, ...opt, save }),
      });
      if (res.status === 401) {
        open("login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");
      setImg(data.url);
      if (data.saved) {
        setSavedMsg("상품 이미지로 저장되었습니다.");
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setPanel(!panel)} className="btn-line w-full">
        ✨ AI 이미지 만들기
      </button>

      {panel && (
        <div className="mt-3 space-y-4 rounded-xl2 border border-line p-4">
          <Chips label="컷 종류" options={CHOICES.shot} value={opt.shot} onChange={(v) => setOpt({ ...opt, shot: v })} />
          <Chips label="성별" options={CHOICES.gender} value={opt.gender} onChange={(v) => setOpt({ ...opt, gender: v })} disabled={isCloseUp} />
          <Chips label="연령대" options={CHOICES.age} value={opt.age} onChange={(v) => setOpt({ ...opt, age: v })} disabled={isCloseUp} />
          <Chips label="배경" options={CHOICES.background} value={opt.background} onChange={(v) => setOpt({ ...opt, background: v })} />

          <div className="flex gap-2">
            <button onClick={() => generate(false)} disabled={busy} className="btn-brand flex-1">
              {busy ? "생성 중… (최대 30초)" : "이미지 생성"}
            </button>
            <button onClick={() => generate(true)} disabled={busy} className="btn-line shrink-0 px-3 text-xs">
              생성 + 상품저장
            </button>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
          {savedMsg && <p className="text-sm text-green-700">{savedMsg}</p>}

          {img && (
            <div className="overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="AI 생성 이미지" className="w-full" />
              <div className="flex gap-2 p-2">
                <a href={img} download={`ai-${goodsNo}.png`} target="_blank" className="btn-line flex-1 text-center text-xs">
                  ⬇ 다운로드
                </a>
                <button onClick={() => generate(true)} disabled={busy} className="btn-brand flex-1 text-xs">
                  상품 이미지로 저장
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-sub">
            생성된 이미지는 영업·홍보용으로 사용하실 수 있습니다. 실제 상품과 색상·질감이 다를 수 있으니 참고용으로 활용해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
