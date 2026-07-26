"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAudienceCount, sendCampaign } from "./actions";
import type { CrmFilter } from "@/lib/crm/audience";
import type { MessageChannel } from "@/lib/crm/send";

type GradeOpt = { id: string; name: string };
type ProductOpt = { id: string; goodsNo: string; name: string; image: string | null; salePrice: number | null };

const CHANNELS: { key: MessageChannel; label: string; desc: string }[] = [
  { key: "friendtalk", label: "카카오 친구톡", desc: "광고·판촉 · 채널 친구에게만" },
  { key: "alimtalk", label: "카카오 알림톡", desc: "정보성(판매·정산 알림) · 템플릿 필요" },
  { key: "sms", label: "문자(LMS)", desc: "번호만 있으면 발송" },
];

export default function Composer({
  grades,
  products,
  siteUrl,
}: {
  grades: GradeOpt[];
  products: ProductOpt[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("friendtalk");
  const [content, setContent] = useState("");
  const [productId, setProductId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // 세그먼트
  const [filter, setFilter] = useState<CrmFilter>({ approvedOnly: true, marketingOnly: true });
  const [count, setCount] = useState<number | null>(null);

  const selProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  // 상품 선택 → 이미지·링크 자동
  useEffect(() => {
    if (!selProduct) return;
    setImageUrl(selProduct.image ?? "");
    setLinkUrl(`${siteUrl}/goods/${selProduct.goodsNo}`);
    if (!content.trim()) {
      setContent(`[돈버는 명품샵] 이번 주 추천 상품이 도착했어요!\n\n${selProduct.name}\n지금 내 코드로 판매하고 수수료를 받아보세요 👉`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // 친구톡은 마케팅 동의 + 채널친구가 기본, 알림톡/문자는 완화
  useEffect(() => {
    setFilter((f) => ({
      ...f,
      marketingOnly: channel === "friendtalk" ? true : f.marketingOnly,
      channelFriendOnly: channel === "friendtalk" ? true : false,
    }));
  }, [channel]);

  // 대상 수 실시간 계산
  useEffect(() => {
    let alive = true;
    getAudienceCount(filter).then((c) => alive && setCount(c));
    return () => {
      alive = false;
    };
  }, [filter]);

  function send() {
    setMsg(null);
    start(async () => {
      const r = await sendCampaign({ title, channel, content, imageUrl, linkUrl, productId: productId || undefined, filter });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        router.refresh();
        setTitle("");
        setContent("");
        setProductId("");
        setImageUrl("");
        setLinkUrl("");
      }
    });
  }

  const chip = "rounded-md border border-line px-2 py-1.5 text-sm";
  const toggle = (on: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-semibold ${on ? "border-brand bg-brand text-white" : "border-line text-ink/70"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* 작성 */}
      <div className="card space-y-4 p-5">
        <div>
          <div className="mb-1 text-xs font-semibold text-sub">채널</div>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setChannel(c.key)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${channel === c.key ? "border-brand bg-brandsoft" : "border-line"}`}
              >
                <div className="font-bold">{c.label}</div>
                <div className="text-[11px] text-sub">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <div className="mb-1 text-xs font-semibold text-sub">캠페인 제목 (내부용)</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="7월 4주차 추천상품" className="field" />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-semibold text-sub">추천 상품 (선택 — 이미지·링크 자동)</div>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="field">
            <option value="">직접 작성</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-semibold text-sub">본문</div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="field font-sans" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-sub">이미지 URL</div>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="field" />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-sub">링크 URL</div>
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="field" />
          </label>
        </div>
      </div>

      {/* 대상 + 미리보기 + 발송 */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="mb-2 text-sm font-bold">발송 대상</div>
          <div className="flex flex-wrap gap-1.5">
            <button className={toggle(!!filter.marketingOnly)} onClick={() => setFilter({ ...filter, marketingOnly: !filter.marketingOnly })}>
              마케팅 동의
            </button>
            <button className={toggle(!!filter.channelFriendOnly)} onClick={() => setFilter({ ...filter, channelFriendOnly: !filter.channelFriendOnly })}>
              채널 친구
            </button>
            <button className={toggle(!!filter.hasSales)} onClick={() => setFilter({ ...filter, hasSales: !filter.hasSales })}>
              판매 실적자
            </button>
            <button className={toggle(filter.activeDays === 30)} onClick={() => setFilter({ ...filter, activeDays: filter.activeDays === 30 ? undefined : 30 })}>
              최근 30일 활동
            </button>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-xs text-sub">등급</div>
            <select value={filter.gradeId ?? ""} onChange={(e) => setFilter({ ...filter, gradeId: e.target.value || undefined })} className={`${chip} w-full`}>
              <option value="">전체 등급</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 rounded-lg bg-brandsoft p-3 text-center">
            <span className="text-xs text-sub">예상 발송 대상</span>
            <div className="text-2xl font-black text-brand">{count == null ? "…" : count.toLocaleString()}명</div>
          </div>
          {channel === "friendtalk" && (
            <p className="mt-2 text-[11px] text-amber-600">친구톡은 <b>채널 친구 + 마케팅 동의자</b>에게만 발송됩니다.</p>
          )}
        </div>

        {/* 미리보기 (카톡풍) */}
        <div className="card p-5">
          <div className="mb-2 text-sm font-bold">미리보기</div>
          <div className="rounded-xl bg-[#b2c7d9] p-3">
            <div className="overflow-hidden rounded-xl bg-white">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="aspect-[2/1] w-full object-cover" />
              )}
              <div className="whitespace-pre-wrap p-3 text-[13px] leading-relaxed">{content || "본문 미리보기"}</div>
              {linkUrl && <div className="border-t border-line p-2.5 text-center text-xs font-bold text-brand">자세히 보기</div>}
            </div>
          </div>
        </div>

        <button onClick={send} disabled={pending || !content.trim()} className="btn-brand w-full py-3">
          {pending ? "발송 중…" : count != null ? `${count.toLocaleString()}명에게 발송` : "발송"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
