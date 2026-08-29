"use client";

// 추천받기 바텀시트 — 고객이 취향 정보를 남기면 컨시어지가 맞춤 추천
import { useState, useTransition } from "react";
import { submitRecommendLead } from "./actions";

const BRANDS = ["샤넬", "루이비통", "구찌", "디올", "프라다", "미우미우", "보테가", "발렌시아가", "기타"];
const AGES = ["20대", "30대", "40대", "50대+"];
const GENDERS = ["여성", "남성"];
const BUDGETS = ["100만원 이하", "100~300만원", "300~500만원", "500만원 이상"];

export default function RecommendSheet({ slug, conciergeName }: { slug: string; conciergeName: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [budget, setBudget] = useState("");
  const [sizes, setSizes] = useState("");
  const [memo, setMemo] = useState("");

  const toggleBrand = (b: string) =>
    setBrands((v) => (v.includes(b) ? v.filter((x) => x !== b) : [...v, b]));

  const submit = () =>
    start(async () => {
      const r = await submitRecommendLead({ slug, name, phone, brands, ageRange, gender, budget, sizes, memo });
      if (r.ok) setDone(true);
      else setMsg(r.message);
    });

  const chip = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
      on ? "border-[#4A60FF] bg-[#4A60FF] text-white" : "border-gray-200 bg-white text-gray-600"
    }`;

  return (
    <>
      {/* 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl bg-[#4A60FF] py-4 text-[16px] font-extrabold text-white shadow-[0_10px_28px_rgba(74,96,255,.4)] active:scale-[0.98]"
        >
          🎁 나에게 맞는 명품 추천받기
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/45" onClick={() => !pending && setOpen(false)}>
          <div
            className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
            {done ? (
              <div className="py-10 text-center">
                <div className="text-5xl">💌</div>
                <div className="mt-4 text-lg font-extrabold">신청 완료!</div>
                <p className="mt-2 text-sm text-gray-500">
                  {conciergeName} 님이 취향에 맞는 명품을 찾아<br />곧 연락드릴게요.
                </p>
                <button onClick={() => setOpen(false)} className="mt-6 w-full rounded-2xl bg-[#4A60FF] py-3.5 font-bold text-white">
                  확인
                </button>
              </div>
            ) : (
              <>
                <div className="text-lg font-extrabold">맞춤 추천받기</div>
                <p className="mt-1 text-[13px] text-gray-500">
                  남겨주신 취향으로 {conciergeName} 님이 딱 맞는 상품을 추천해드려요.
                </p>

                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 *"
                      className="w-1/3 rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처 (010-0000-0000) *" inputMode="tel"
                      className="flex-1 rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />
                  </div>

                  <div>
                    <div className="mb-2 text-[13px] font-bold text-gray-700">관심 브랜드 <span className="font-normal text-gray-400">(복수 선택)</span></div>
                    <div className="flex flex-wrap gap-1.5">
                      {BRANDS.map((b) => (
                        <button key={b} onClick={() => toggleBrand(b)} className={chip(brands.includes(b))}>{b}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[13px] font-bold text-gray-700">나이대</div>
                    <div className="flex flex-wrap gap-1.5">
                      {AGES.map((a) => (
                        <button key={a} onClick={() => setAgeRange(a)} className={chip(ageRange === a)}>{a}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[13px] font-bold text-gray-700">성별</div>
                    <div className="flex flex-wrap gap-1.5">
                      {GENDERS.map((g) => (
                        <button key={g} onClick={() => setGender(g)} className={chip(gender === g)}>{g}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[13px] font-bold text-gray-700">구매 예산</div>
                    <div className="flex flex-wrap gap-1.5">
                      {BUDGETS.map((b) => (
                        <button key={b} onClick={() => setBudget(b)} className={chip(budget === b)}>{b}</button>
                      ))}
                    </div>
                  </div>

                  <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="사이즈 (예: 55 / 240mm / M)"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="찾는 상품이나 요청사항이 있다면 적어주세요 (선택)" rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />

                  {msg && <div className="text-center text-[13px] font-semibold text-red-500">{msg}</div>}

                  <button onClick={submit} disabled={pending}
                    className="w-full rounded-2xl bg-[#4A60FF] py-4 text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(74,96,255,.35)] disabled:opacity-60">
                    {pending ? "접수 중…" : "추천 신청하기"}
                  </button>
                  <p className="pb-1 text-center text-[11px] leading-relaxed text-gray-400">
                    남겨주신 정보는 맞춤 추천 목적으로만 사용됩니다.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
