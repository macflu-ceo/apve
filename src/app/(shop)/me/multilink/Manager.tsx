"use client";

// 컨시어지 멀티링크 관리 — 프로필·상품 큐레이션·추천 신청 DB
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMultiLinkProfile,
  addMultiLinkItem,
  removeMultiLinkItem,
  toggleMultiLinkFeatured,
  moveMultiLinkItem,
  setLeadStatus,
} from "./actions";

type Item = {
  id: string;
  productId: string;
  featured: boolean;
  name: string;
  brand: string | null;
  image: string | null;
  salePrice: number | null;
  commission: number | null;
};
type Candidate = Omit<Item, "id" | "featured">;
type Lead = {
  id: string; name: string; phone: string;
  brands: string | null; ageRange: string | null; gender: string | null;
  budget: string | null; sizes: string | null; memo: string | null;
  status: string; createdAt: string;
};

const won = (n: number) => n.toLocaleString() + "원";

export default function Manager({
  ml, percent, items, candidates, leads,
}: {
  ml: { slug: string; displayName: string; bio: string; avatarUrl: string; featuredTitle: string; views: number };
  percent: number;
  items: Item[];
  candidates: Candidate[];
  leads: Lead[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [profile, setProfile] = useState({ displayName: ml.displayName, bio: ml.bio, avatarUrl: ml.avatarUrl, featuredTitle: ml.featuredTitle });
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const url = `https://www.cashboutique.co.kr/m/${ml.slug}`;
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok && r.message) setMsg(r.message);
      router.refresh();
    });

  async function uploadAvatar(f: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.url) setProfile((p) => ({ ...p, avatarUrl: d.url }));
      else setMsg(d.error ?? "업로드 실패");
    } catch {
      setMsg("업로드 실패");
    }
    setUploading(false);
  }

  const newLeads = leads.filter((l) => l.status === "new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
      <h1 className="text-xl font-black">내 멀티링크</h1>
      <p className="mt-1 text-sm text-sub">내가 고른 상품을 한 페이지로 모아 공유하세요. 이 링크로 팔려도 수수료는 동일하게 적립됩니다.</p>

      {/* 링크 카드 */}
      <div className="card mt-4 flex flex-wrap items-center gap-2 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-sub">내 멀티링크 주소 · 조회 {ml.views.toLocaleString()}회</div>
          <div className="truncate text-sm font-bold text-brand">{url}</div>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(url); setMsg("링크가 복사되었습니다."); }} className="btn-brand px-4 py-2 text-sm">복사</button>
        <a href={`/m/${ml.slug}`} target="_blank" className="btn-line px-4 py-2 text-sm">미리보기</a>
      </div>
      {msg && <div className="mt-2 text-sm font-semibold text-brand">{msg}</div>}

      {/* 프로필 */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">프로필</h2>
        <div className="mt-3 flex items-start gap-4">
          <label className="block cursor-pointer text-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} className="h-16 w-16 rounded-full object-cover ring-2 ring-brandsoft" alt="" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brandsoft text-2xl">🛍️</div>
            )}
            <span className="mt-1 block text-[11px] text-brand">{uploading ? "업로드중…" : "사진 변경"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </label>
          <div className="flex-1 space-y-2">
            <input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} placeholder="표시 이름" className="field w-full" />
            <input value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="소개 문구 (예: 명품, 아는 사람 가격으로 추천해드려요)" className="field w-full" />
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-sub">강조 섹션 제목</span>
              <input value={profile.featuredTitle} onChange={(e) => setProfile({ ...profile, featuredTitle: e.target.value })} className="field flex-1" />
            </div>
          </div>
        </div>
        <button onClick={() => run(() => updateMultiLinkProfile(profile))} disabled={pending} className="btn-brand mt-3 px-5 py-2 text-sm">
          {pending ? "저장 중…" : "프로필 저장"}
        </button>
      </div>

      {/* 페이지에 담긴 상품 */}
      <div className="card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold">페이지 상품 <span className="text-sm font-normal text-sub">({items.length})</span></h2>
          <span className="text-xs text-sub">★ = 강조 섹션 · 내 수수료율 {percent}%</span>
        </div>
        <div className="mt-3 space-y-2">
          {items.length === 0 && <div className="py-4 text-center text-sm text-sub">아래 목록에서 상품을 추가해보세요.</div>}
          {items.map((it, i) => (
            <div key={it.id} className="flex items-center gap-3 rounded-xl border border-line p-2">
              {it.image && <img src={it.image} className="h-14 w-14 rounded-lg bg-[#fafafa] object-contain" alt="" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{it.brand && <span className="mr-1 text-sub">{it.brand}</span>}{it.name}</div>
                <div className="text-xs text-sub">
                  {it.salePrice != null && won(it.salePrice)}
                  {it.commission != null && <b className="ml-2 text-brand">수수료 {won(it.commission)}</b>}
                </div>
              </div>
              <button onClick={() => run(() => toggleMultiLinkFeatured(it.id))} title="강조"
                className={`rounded-lg px-2 py-1 text-sm ${it.featured ? "bg-brand text-white" : "bg-brandsoft text-sub"}`}>★</button>
              <div className="flex flex-col">
                <button onClick={() => run(() => moveMultiLinkItem(it.id, "up"))} disabled={i === 0} className="px-1.5 text-xs text-sub disabled:opacity-25">▲</button>
                <button onClick={() => run(() => moveMultiLinkItem(it.id, "down"))} disabled={i === items.length - 1} className="px-1.5 text-xs text-sub disabled:opacity-25">▼</button>
              </div>
              <button onClick={() => run(() => removeMultiLinkItem(it.id))} className="px-1 text-xs text-red-500">빼기</button>
            </div>
          ))}
        </div>
      </div>

      {/* 추가 가능한 상품 (내가 코드 만든 것) */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">담을 수 있는 상품 <span className="text-sm font-normal text-sub">— 내가 코드 만든 상품</span></h2>
        <div className="mt-3 space-y-2">
          {candidates.length === 0 && (
            <div className="py-4 text-center text-sm text-sub">상품 상세에서 &lsquo;내 코드 만들기&rsquo;를 하면 여기 나타나요.</div>
          )}
          {candidates.map((c) => (
            <div key={c.productId} className="flex items-center gap-3 rounded-xl border border-line p-2">
              {c.image && <img src={c.image} className="h-12 w-12 rounded-lg bg-[#fafafa] object-contain" alt="" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{c.brand && <span className="mr-1 text-sub">{c.brand}</span>}{c.name}</div>
                <div className="text-xs text-sub">{c.salePrice != null && won(c.salePrice)}{c.commission != null && <b className="ml-2 text-brand">수수료 {won(c.commission)}</b>}</div>
              </div>
              <button onClick={() => run(() => addMultiLinkItem(c.productId))} disabled={pending} className="btn-line px-3 py-1.5 text-sm">+ 추가</button>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 신청 DB */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">
          추천 신청 <span className="text-sm font-normal text-sub">({leads.length})</span>
          {newLeads.length > 0 && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">새 신청 {newLeads.length}</span>}
        </h2>
        <div className="mt-3 space-y-2">
          {leads.length === 0 && <div className="py-4 text-center text-sm text-sub">멀티링크의 &lsquo;추천받기&rsquo;로 들어온 고객 정보가 여기 쌓여요.</div>}
          {leads.map((l) => (
            <div key={l.id} className={`rounded-xl border p-3 ${l.status === "new" ? "border-brand/40 bg-brandsoft/40" : "border-line"}`}>
              <div className="flex items-center gap-2">
                <b className="text-sm">{l.name}</b>
                <a href={`tel:${l.phone}`} className="text-sm text-brand underline">{l.phone}</a>
                <span className="ml-auto text-[11px] text-sub">{l.createdAt}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[l.brands, l.ageRange, l.gender, l.budget, l.sizes && `사이즈 ${l.sizes}`].filter(Boolean).map((v, i) => (
                  <span key={i} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-ink ring-1 ring-line">{v}</span>
                ))}
              </div>
              {l.memo && <div className="mt-1.5 text-xs text-sub">💬 {l.memo}</div>}
              <button
                onClick={() => run(() => setLeadStatus(l.id, l.status === "new" ? "done" : "new"))}
                className={`mt-2 rounded-lg px-3 py-1 text-xs font-bold ${l.status === "new" ? "bg-brand text-white" : "bg-brandsoft text-sub"}`}
              >
                {l.status === "new" ? "응대 완료로 표시" : "완료됨 ↺"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
