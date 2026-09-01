"use client";

// 컨시어지 멀티링크 관리 — 프로필·진열 섹션·상품 큐레이션·취향등록 DB
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateMultiLinkProfile,
  addMultiLinkItem,
  removeMultiLinkItem,
  moveMultiLinkItem,
  createSection,
  renameSection,
  deleteSection,
  moveSection,
  setItemSection,
  setLeadStatus,
  addBanner,
  updateBanner,
  deleteBanner,
  moveBanner,
} from "./actions";

type Item = {
  id: string;
  productId: string;
  sectionId: string | null;
  name: string;
  brand: string | null;
  image: string | null;
  salePrice: number | null;
  commission: number | null;
};
type Candidate = Omit<Item, "id" | "sectionId">;
type Section = { id: string; title: string };
type Banner = { id: string; imageUrl: string; title: string; sectionId: string | null };
type Lead = {
  id: string; name: string; phone: string;
  brands: string | null; ageRange: string | null; gender: string | null;
  budget: string | null; sizes: string | null; memo: string | null;
  status: string; createdAt: string;
};

const won = (n: number) => n.toLocaleString() + "원";

export default function Manager({
  ml, percent, sections, banners, items, candidates, leads,
}: {
  ml: { slug: string; displayName: string; bio: string; avatarUrl: string; coverUrl: string; views: number };
  percent: number;
  sections: Section[];
  banners: Banner[];
  items: Item[];
  candidates: Candidate[];
  leads: Lead[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [profile, setProfile] = useState({ displayName: ml.displayName, bio: ml.bio, avatarUrl: ml.avatarUrl, coverUrl: ml.coverUrl });
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<"list" | "card">("list");
  const [newSection, setNewSection] = useState("");
  const [newBanner, setNewBanner] = useState({ imageUrl: "", title: "", sectionId: "" });
  const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);

  const url = `https://veca.sh/${ml.slug}`;
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok && r.message) setMsg(r.message);
      router.refresh();
    });

  async function uploadImage(f: File, key: "avatarUrl" | "coverUrl") {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.url) setProfile((p) => ({ ...p, [key]: d.url }));
      else setMsg(d.error ?? "업로드 실패");
    } catch {
      setMsg("업로드 실패");
    }
    setUploading(false);
  }

  const newLeads = leads.filter((l) => l.status === "new");
  const groups: { section: Section | null; rows: Item[] }[] = [
    ...sections.map((s) => ({ section: s as Section | null, rows: items.filter((i) => i.sectionId === s.id) })),
    { section: null, rows: items.filter((i) => i.sectionId == null) },
  ];

  const SectionSelect = ({ it }: { it: Item }) => (
    <select
      value={it.sectionId ?? ""}
      onChange={(e) => run(() => setItemSection(it.id, e.target.value || null))}
      className="rounded-lg border border-line bg-white px-1.5 py-1 text-[11px] text-sub"
    >
      <option value="">기본 진열</option>
      {sections.map((s) => (
        <option key={s.id} value={s.id}>{s.title}</option>
      ))}
    </select>
  );

  const ItemRow = ({ it, i, len }: { it: Item; i: number; len: number }) => (
    <div className="flex items-center gap-2 rounded-xl border border-line px-2 py-1.5">
      {it.image && <img src={it.image} className="h-9 w-9 shrink-0 rounded-md bg-[#fafafa] object-contain" alt="" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold">
          {it.brand && <span className="mr-1 font-semibold text-sub">{it.brand}</span>}{it.name}
        </div>
        <div className="text-[11px] text-sub">
          {it.salePrice != null && won(it.salePrice)}
          {it.commission != null && <b className="ml-1.5 text-brand">수수료 {won(it.commission)}</b>}
        </div>
      </div>
      <SectionSelect it={it} />
      <div className="flex flex-col">
        <button onClick={() => run(() => moveMultiLinkItem(it.id, "up"))} disabled={i === 0} className="px-1 text-[10px] leading-3 text-sub disabled:opacity-25">▲</button>
        <button onClick={() => run(() => moveMultiLinkItem(it.id, "down"))} disabled={i === len - 1} className="px-1 text-[10px] leading-3 text-sub disabled:opacity-25">▼</button>
      </div>
      <button onClick={() => run(() => removeMultiLinkItem(it.id))} className="px-1 text-[11px] text-red-500">빼기</button>
    </div>
  );

  const ItemCard = ({ it, i, len }: { it: Item; i: number; len: number }) => (
    <div className="rounded-xl border border-line p-2">
      <div className="aspect-square rounded-lg bg-[#fafafa]">
        {it.image && <img src={it.image} className="h-full w-full object-contain" alt="" />}
      </div>
      <div className="mt-1.5 truncate text-[12px] font-bold">{it.name}</div>
      <div className="text-[11px] text-sub">
        {it.salePrice != null && won(it.salePrice)}
        {it.commission != null && <b className="ml-1 text-brand">+{won(it.commission)}</b>}
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <SectionSelect it={it} />
        <button onClick={() => run(() => moveMultiLinkItem(it.id, "up"))} disabled={i === 0} className="text-[11px] text-sub disabled:opacity-25">▲</button>
        <button onClick={() => run(() => moveMultiLinkItem(it.id, "down"))} disabled={i === len - 1} className="text-[11px] text-sub disabled:opacity-25">▼</button>
        <button onClick={() => run(() => removeMultiLinkItem(it.id))} className="ml-auto text-[11px] text-red-500">빼기</button>
      </div>
    </div>
  );

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
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatarUrl")} />
          </label>
          <div className="flex-1 space-y-2">
            <input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} placeholder="표시 이름" className="field w-full" />
            <input value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="소개 문구 (예: 명품, 아는 사람 가격으로 추천해드려요)" className="field w-full" />
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1.5 text-[13px] font-bold text-gray-700">배경(커버) 이미지 <span className="font-normal text-sub">— 페이지 상단에 화면 맞춤으로 깔립니다</span></div>
          <label className="block cursor-pointer">
            {profile.coverUrl ? (
              <img src={profile.coverUrl} className="h-24 w-full rounded-xl object-cover" alt="" />
            ) : (
              <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-line bg-brandsoft/40 text-sm text-sub">
                + 배경 이미지 올리기 (권장 1200×800 이상)
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "coverUrl")} />
          </label>
          {profile.coverUrl && (
            <button onClick={() => setProfile((p) => ({ ...p, coverUrl: "" }))} className="mt-1 text-xs text-red-500 underline">배경 제거</button>
          )}
        </div>
        <button onClick={() => run(() => updateMultiLinkProfile(profile))} disabled={pending} className="btn-brand mt-3 px-5 py-2 text-sm">
          {pending ? "저장 중…" : "프로필 저장"}
        </button>
      </div>

      {/* 진열 섹션 관리 */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">진열 섹션</h2>
        <p className="mt-0.5 text-xs text-sub">섹션을 만들면 페이지에서 제목별로 상품이 나뉘어 보여요. 섹션이 없는 상품은 &lsquo;기본 진열&rsquo;에 표시됩니다.</p>
        <div className="mt-3 space-y-2">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
              {editingSection?.id === s.id ? (
                <>
                  <input value={editingSection.title} onChange={(e) => setEditingSection({ id: s.id, title: e.target.value })} className="field flex-1 py-1 text-sm" autoFocus />
                  <button onClick={() => { run(() => renameSection(s.id, editingSection.title)); setEditingSection(null); }} className="btn-brand px-3 py-1 text-xs">저장</button>
                </>
              ) : (
                <>
                  <b className="flex-1 text-sm">{s.title}</b>
                  <span className="text-[11px] text-sub">{items.filter((x) => x.sectionId === s.id).length}개</span>
                  <button onClick={() => setEditingSection({ id: s.id, title: s.title })} className="text-xs text-sub underline">이름</button>
                  <button onClick={() => run(() => moveSection(s.id, "up"))} disabled={i === 0} className="text-xs text-sub disabled:opacity-25">▲</button>
                  <button onClick={() => run(() => moveSection(s.id, "down"))} disabled={i === sections.length - 1} className="text-xs text-sub disabled:opacity-25">▼</button>
                  <button onClick={() => run(() => deleteSection(s.id))} className="text-xs text-red-500">삭제</button>
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="새 섹션 이름 (예: 이번 주 신상)" className="field flex-1"
              onKeyDown={(e) => e.key === "Enter" && newSection.trim() && (run(() => createSection(newSection)), setNewSection(""))} />
            <button onClick={() => { run(() => createSection(newSection)); setNewSection(""); }} disabled={pending || !newSection.trim()} className="btn-line px-4 text-sm">+ 섹션 추가</button>
          </div>
        </div>
      </div>

      {/* 이미지 배너 (기획전) */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">이미지 배너 <span className="text-sm font-normal text-sub">— 섹션을 연결하면 눌렀을 때 기획전으로 열려요</span></h2>
        <div className="mt-3 space-y-2">
          {banners.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2 rounded-xl border border-line p-2">
              <img src={b.imageUrl} className="h-12 w-20 shrink-0 rounded-lg object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold">{b.title || "(제목 없음)"}</div>
                <select
                  value={b.sectionId ?? ""}
                  onChange={(e) => run(() => updateBanner(b.id, { title: b.title, sectionId: e.target.value || null }))}
                  className="mt-0.5 rounded-lg border border-line bg-white px-1.5 py-0.5 text-[11px] text-sub"
                >
                  <option value="">연결 안 함 (이미지만)</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>기획전: {s.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <button onClick={() => run(() => moveBanner(b.id, "up"))} disabled={i === 0} className="px-1 text-[10px] leading-3 text-sub disabled:opacity-25">▲</button>
                <button onClick={() => run(() => moveBanner(b.id, "down"))} disabled={i === banners.length - 1} className="px-1 text-[10px] leading-3 text-sub disabled:opacity-25">▼</button>
              </div>
              <button onClick={() => run(() => deleteBanner(b.id))} className="px-1 text-[11px] text-red-500">삭제</button>
            </div>
          ))}

          <div className="rounded-xl border border-dashed border-line p-3">
            <div className="flex items-center gap-3">
              <label className="block shrink-0 cursor-pointer">
                {newBanner.imageUrl ? (
                  <img src={newBanner.imageUrl} className="h-14 w-24 rounded-lg object-cover" alt="" />
                ) : (
                  <div className="flex h-14 w-24 items-center justify-center rounded-lg bg-brandsoft text-[11px] font-bold text-brand">+ 이미지</div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setUploading(true);
                  try {
                    const fd = new FormData(); fd.append("file", f);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const d = await res.json();
                    if (d.url) setNewBanner((v) => ({ ...v, imageUrl: d.url })); else setMsg(d.error ?? "업로드 실패");
                  } catch { setMsg("업로드 실패"); }
                  setUploading(false);
                }} />
              </label>
              <div className="flex-1 space-y-1.5">
                <input value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="배너 제목 (예: 가을 신상 기획전)" className="field w-full py-1.5 text-sm" />
                <select value={newBanner.sectionId} onChange={(e) => setNewBanner({ ...newBanner, sectionId: e.target.value })} className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-sub">
                  <option value="">연결 안 함 (이미지만)</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>기획전으로 연결: {s.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => { run(() => addBanner({ imageUrl: newBanner.imageUrl, title: newBanner.title, sectionId: newBanner.sectionId || null })); setNewBanner({ imageUrl: "", title: "", sectionId: "" }); }}
              disabled={pending || uploading || !newBanner.imageUrl}
              className="btn-brand mt-2 w-full py-2 text-sm"
            >
              {uploading ? "이미지 업로드 중…" : "+ 배너 추가"}
            </button>
          </div>
        </div>
      </div>

      {/* 페이지 상품 */}
      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">페이지 상품 <span className="text-sm font-normal text-sub">({items.length})</span></h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sub">내 수수료율 {percent}%</span>
            <div className="flex overflow-hidden rounded-lg border border-line text-xs">
              <button onClick={() => setView("list")} className={`px-2.5 py-1 ${view === "list" ? "bg-brand text-white" : "text-sub"}`}>리스트</button>
              <button onClick={() => setView("card")} className={`px-2.5 py-1 ${view === "card" ? "bg-brand text-white" : "text-sub"}`}>카드</button>
            </div>
          </div>
        </div>

        {items.length === 0 && <div className="py-4 text-center text-sm text-sub">아래 목록에서 상품을 추가해보세요.</div>}

        {groups.map(({ section, rows }) =>
          rows.length === 0 && section == null && sections.length > 0 && items.length > 0 ? null : rows.length === 0 ? (
            section ? <div key={section.id} className="mt-3 text-xs text-sub">〈{section.title}〉 비어 있음 — 상품의 섹션 선택에서 옮겨보세요.</div> : null
          ) : (
            <div key={section?.id ?? "default"} className="mt-4">
              <div className="mb-2 text-[13px] font-bold text-ink/70">{section ? `〈${section.title}〉` : "기본 진열"}</div>
              {view === "list" ? (
                <div className="space-y-1.5">
                  {rows.map((it, i) => <ItemRow key={it.id} it={it} i={i} len={rows.length} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {rows.map((it, i) => <ItemCard key={it.id} it={it} i={i} len={rows.length} />)}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* 담을 수 있는 상품 */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">담을 수 있는 상품 <span className="text-sm font-normal text-sub">— 내가 코드 만든 상품</span></h2>
        <div className="mt-3 space-y-1.5">
          {candidates.length === 0 && (
            <div className="py-4 text-center text-sm text-sub">상품 상세에서 &lsquo;내 코드 만들기&rsquo;를 하면 여기 나타나요.</div>
          )}
          {candidates.map((c) => (
            <div key={c.productId} className="flex items-center gap-2 rounded-xl border border-line px-2 py-1.5">
              {c.image && <img src={c.image} className="h-9 w-9 shrink-0 rounded-md bg-[#fafafa] object-contain" alt="" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold">{c.brand && <span className="mr-1 font-semibold text-sub">{c.brand}</span>}{c.name}</div>
                <div className="text-[11px] text-sub">{c.salePrice != null && won(c.salePrice)}{c.commission != null && <b className="ml-1.5 text-brand">수수료 {won(c.commission)}</b>}</div>
              </div>
              <button onClick={() => run(() => addMultiLinkItem(c.productId))} disabled={pending} className="btn-line px-3 py-1 text-xs">+ 추가</button>
            </div>
          ))}
        </div>
      </div>

      {/* 취향 등록 DB */}
      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold">
          고객 취향 등록 <span className="text-sm font-normal text-sub">({leads.length})</span>
          {newLeads.length > 0 && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">새 등록 {newLeads.length}</span>}
        </h2>
        <div className="mt-3 space-y-2">
          {leads.length === 0 && <div className="py-4 text-center text-sm text-sub">멀티링크의 &lsquo;내 취향 등록하기&rsquo;로 들어온 고객 정보가 여기 쌓여요.</div>}
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
