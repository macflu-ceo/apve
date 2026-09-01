"use client";

// 취향 등록 바텀시트 — 카테고리별 사이즈 동적 입력 + 고도몰 브랜드 검색
import { useEffect, useState, useTransition } from "react";
import { submitRecommendLead } from "./actions";

const FAMOUS_BRANDS = ["샤넬", "루이비통", "구찌", "디올", "프라다", "미우미우", "보테가", "발렌시아가"];
const CATEGORIES = ["가방", "지갑·소품", "신발", "아우터", "상의", "바지·스커트", "시계·주얼리"];
const SIZE_FIELDS: Record<string, { label: string; placeholder: string }> = {
  신발: { label: "신발 사이즈", placeholder: "예: 240 / EU38" },
  아우터: { label: "아우터 사이즈", placeholder: "예: 55 / M / IT38" },
  상의: { label: "상의 사이즈", placeholder: "예: 55 / M" },
  "바지·스커트": { label: "하의 사이즈", placeholder: "예: 26 / 55" },
};
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
  const [cats, setCats] = useState<string[]>([]);
  const [sizeMap, setSizeMap] = useState<Record<string, string>>({});
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [budget, setBudget] = useState("");
  const [memo, setMemo] = useState("");

  // 브랜드 검색 (기타)
  const [brandSearchOpen, setBrandSearchOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [allBrands, setAllBrands] = useState<string[] | null>(null);

  useEffect(() => {
    if (brandSearchOpen && allBrands === null) {
      fetch("/api/m/brands")
        .then((r) => r.json())
        .then((d) => setAllBrands(Array.isArray(d.brands) ? d.brands : []))
        .catch(() => setAllBrands([]));
    }
  }, [brandSearchOpen, allBrands]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const brandResults = (allBrands ?? [])
    .filter((b) => !brands.includes(b))
    .filter((b) => brandQuery.trim() === "" || b.toLowerCase().includes(brandQuery.trim().toLowerCase()))
    .slice(0, 30);

  const sizeCats = cats.filter((c) => SIZE_FIELDS[c]);

  const submit = () =>
    start(async () => {
      const sizes = sizeCats
        .map((c) => (sizeMap[c]?.trim() ? `${SIZE_FIELDS[c].label} ${sizeMap[c].trim()}` : null))
        .filter(Boolean)
        .join(" · ");
      const r = await submitRecommendLead({
        slug, name, phone, brands, categories: cats, ageRange, gender, budget, sizes, memo,
      });
      if (r.ok) setDone(true);
      else setMsg(r.message);
    });

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
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
          💎 내 취향 등록하기
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/45" onClick={() => !pending && setOpen(false)}>
          <div
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
            {done ? (
              <div className="py-10 text-center">
                <div className="text-5xl">💌</div>
                <div className="mt-4 text-lg font-extrabold">등록 완료!</div>
                <p className="mt-2 text-sm text-gray-500">
                  {conciergeName} 님이 취향에 맞는 명품이 들어오면<br />바로 추천해드릴게요.
                </p>
                <button onClick={() => setOpen(false)} className="mt-6 w-full rounded-2xl bg-[#4A60FF] py-3.5 font-bold text-white">
                  확인
                </button>
              </div>
            ) : (
              <>
                <div className="text-lg font-extrabold">내 취향 등록하기</div>
                <p className="mt-1 text-[13px] text-gray-500">
                  취향을 등록해두시면 {conciergeName} 님이 딱 맞는 상품이 들어올 때마다 추천해드려요.
                </p>

                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 *"
                      className="w-1/3 rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처 (010-0000-0000) *" inputMode="tel"
                      className="flex-1 rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />
                  </div>

                  {/* 관심 브랜드 + 검색 */}
                  <div>
                    <div className="mb-2 text-[13px] font-bold text-gray-700">관심 브랜드 <span className="font-normal text-gray-400">(복수 선택)</span></div>
                    <div className="flex flex-wrap gap-1.5">
                      {FAMOUS_BRANDS.map((b) => (
                        <button key={b} onClick={() => toggle(brands, setBrands, b)} className={chip(brands.includes(b))}>{b}</button>
                      ))}
                      {brands.filter((b) => !FAMOUS_BRANDS.includes(b)).map((b) => (
                        <button key={b} onClick={() => toggle(brands, setBrands, b)} className={chip(true)}>{b} ✕</button>
                      ))}
                      <button onClick={() => setBrandSearchOpen(!brandSearchOpen)} className="rounded-full border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-[12.5px] font-semibold text-gray-500">
                        {brandSearchOpen ? "닫기" : "🔍 다른 브랜드 찾기"}
                      </button>
                    </div>
                    {brandSearchOpen && (
                      <div className="mt-2 rounded-xl border border-gray-200 p-2.5">
                        <input
                          value={brandQuery}
                          onChange={(e) => setBrandQuery(e.target.value)}
                          placeholder="브랜드 검색 (예: celine, row…)"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4A60FF]"
                          autoFocus
                        />
                        <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                          {allBrands === null && <span className="text-[12px] text-gray-400">브랜드 불러오는 중…</span>}
                          {allBrands !== null && brandResults.length === 0 && <span className="text-[12px] text-gray-400">검색 결과가 없어요</span>}
                          {brandResults.map((b) => (
                            <button key={b} onClick={() => { toggle(brands, setBrands, b); setBrandQuery(""); }}
                              className="rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-semibold text-gray-600">
                              + {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 관심 카테고리 */}
                  <div>
                    <div className="mb-2 text-[13px] font-bold text-gray-700">관심 카테고리 <span className="font-normal text-gray-400">(복수 선택)</span></div>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((c) => (
                        <button key={c} onClick={() => toggle(cats, setCats, c)} className={chip(cats.includes(c))}>{c}</button>
                      ))}
                    </div>
                  </div>

                  {/* 선택한 카테고리별 사이즈 */}
                  {sizeCats.length > 0 && (
                    <div className="space-y-2 rounded-xl bg-[#F4F6FF] p-3">
                      <div className="text-[13px] font-bold text-gray-700">내 사이즈</div>
                      {sizeCats.map((c) => (
                        <div key={c} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 text-[12.5px] font-semibold text-gray-600">{SIZE_FIELDS[c].label}</span>
                          <input
                            value={sizeMap[c] ?? ""}
                            onChange={(e) => setSizeMap({ ...sizeMap, [c]: e.target.value })}
                            placeholder={SIZE_FIELDS[c].placeholder}
                            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#4A60FF]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

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

                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="찾는 상품이나 요청사항이 있다면 적어주세요 (선택)" rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-[#4A60FF]" />

                  {msg && <div className="text-center text-[13px] font-semibold text-red-500">{msg}</div>}

                  <button onClick={submit} disabled={pending}
                    className="w-full rounded-2xl bg-[#4A60FF] py-4 text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(74,96,255,.35)] disabled:opacity-60">
                    {pending ? "등록 중…" : "취향 등록하기"}
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
