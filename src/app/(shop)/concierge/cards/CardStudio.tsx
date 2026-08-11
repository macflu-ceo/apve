"use client";

import { useEffect, useRef, useState } from "react";
import { searchCardProducts, myLinkedProducts, type CardProduct } from "./actions";

const won = (n: number) => n.toLocaleString("ko-KR");
const proxied = (u: string | null) => (u ? `/api/img-proxy?url=${encodeURIComponent(u)}` : "");
const disc = (p: CardProduct) =>
  p.listPrice && p.salePrice && p.listPrice > p.salePrice ? Math.round(((p.listPrice - p.salePrice) / p.listPrice) * 100) : 0;

const TEMPLATES = [
  { id: 1, label: "클래식 가격형" },
  { id: 2, label: "할인율 영웅형" },
  { id: 5, label: "럭셔리 다크" },
  { id: 8, label: "미니멀 시그니처" },
];

export default function CardStudio() {
  const [mode, setMode] = useState<"single" | "list">("single");
  const [linked, setLinked] = useState<CardProduct[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CardProduct[]>([]);
  const [tpl, setTpl] = useState(1);
  const [priceLabel, setPriceLabel] = useState("비아엘리떼 컨시어지 가");
  const [listTitle, setListTitle] = useState("이번 주 추천 셀렉션");
  const [single, setSingle] = useState<CardProduct | null>(null);
  const [items, setItems] = useState<CardProduct[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    myLinkedProducts().then(setLinked);
  }, []);

  async function doSearch() {
    if (!q.trim()) return setResults([]);
    setResults(await searchCardProducts(q));
  }

  function pick(p: CardProduct) {
    if (mode === "single") setSingle(p);
    else setItems((prev) => (prev.some((x) => x.goodsNo === p.goodsNo) ? prev : [...prev, p]));
  }

  async function download() {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `viaelite_card_${Date.now()}.png`;
    a.click();
  }

  const pool = results.length ? results : linked;

  return (
    <div className="vecard-root grid gap-6 lg:grid-cols-[380px_1fr]">
      <style>{CSS}</style>

      <div className="space-y-4">
        {/* 모드 */}
        <div className="grid grid-cols-2 gap-2">
          {(["single", "list"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-lg border py-2 text-sm font-bold ${mode === m ? "border-brand bg-brandsoft text-brand" : "border-line"}`}>
              {m === "single" ? "단일형" : "리스트형"}
            </button>
          ))}
        </div>

        {/* 상품 선택 (내 링크복사 상품 + 검색) */}
        <div className="card p-4">
          <div className="mb-2 text-sm font-bold">{mode === "single" ? "상품 선택" : "상품 담기 (여러 개)"}</div>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="검색 또는 아래 내 상품에서 선택" className="field flex-1" />
            <button onClick={doSearch} className="rounded-lg bg-ink px-3 text-sm font-bold text-white">검색</button>
          </div>
          <div className="mt-2 text-[11px] text-sub">{results.length ? "검색 결과" : "내가 링크복사한 상품"}</div>
          <ul className="mt-1 max-h-60 space-y-1 overflow-y-auto">
            {pool.length === 0 ? (
              <li className="p-3 text-center text-xs text-sub">링크복사한 상품이 없어요. 상품 상세에서 ‘내 코드 만들기’를 하거나 위에서 검색하세요.</li>
            ) : pool.map((p) => (
              <li key={p.goodsNo}>
                <button onClick={() => pick(p)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-brandsoft">
                  {p.image && <img src={proxied(p.image)} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.brand} {p.name}</span>
                    <span className="text-xs text-sub">{p.salePrice ? `${won(p.salePrice)}원` : ""}{disc(p) > 0 && ` · ${disc(p)}%`}</span>
                  </span>
                  <span className="shrink-0 text-xs text-brand">담기</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 리스트 담긴 것 */}
        {mode === "list" && items.length > 0 && (
          <div className="card p-4">
            <div className="mb-2 text-sm font-bold">담긴 상품 ({items.length})</div>
            <ul className="space-y-1">
              {items.map((p, i) => (
                <li key={p.goodsNo} className="flex items-center gap-2 rounded bg-brandsoft px-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{p.brand} {p.name}</span>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="shrink-0 text-xs text-red-500">삭제</button>
                </li>
              ))}
            </ul>
            <label className="mt-3 block"><span className="text-xs text-sub">리스트 제목</span><input className="field mt-1 w-full" value={listTitle} onChange={(e) => setListTitle(e.target.value)} /></label>
          </div>
        )}

        {/* 단일: 템플릿 + 라벨 */}
        {mode === "single" && (
          <div className="card p-4">
            <div className="mb-2 text-sm font-bold">템플릿</div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTpl(t.id)} className={`rounded-lg border px-3 py-2 text-sm ${tpl === t.id ? "border-brand bg-brandsoft font-bold text-brand" : "border-line"}`}>{t.label}</button>
              ))}
            </div>
            <label className="mt-3 block"><span className="text-xs text-sub">판매가 라벨</span><input className="field mt-1 w-full" value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} /></label>
          </div>
        )}

        <button onClick={download} className="btn-primary w-full rounded-lg py-3 text-sm font-bold">PNG로 저장 (2x)</button>
      </div>

      {/* 미리보기 */}
      <div className="flex justify-center overflow-x-auto">
        <div ref={cardRef}>
          {mode === "single"
            ? (single ? <Card tpl={tpl} p={single} priceLabel={priceLabel} /> : <Empty text="상품을 선택하세요" />)
            : (items.length ? <ListCard items={items} title={listTitle} /> : <Empty text="상품을 담으세요" />)}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-[520px] w-[480px] items-center justify-center rounded bg-brandsoft text-sm text-sub">{text}</div>;
}

const Logo = <div className="ve-logo">VIA ÉLITE</div>;

function Card({ tpl, p, priceLabel }: { tpl: number; p: CardProduct; priceLabel: string }) {
  const official = p.listPrice ?? 0, sale = p.salePrice ?? official;
  const discount = disc(p), savings = Math.max(official - sale, 0);
  const img = p.image ? <img className="prod" src={proxied(p.image)} alt="" crossOrigin="anonymous" /> : <div className="ph">상품 이미지</div>;
  const brandLine = <div className="brand-line"><span className="brand-en">{p.brand}</span></div>;
  const savingsBand = <div className="savings-band"><span className="label">고객 할인 금액</span><span className="value">{won(savings)}<span className="w">원</span></span></div>;

  if (tpl === 2)
    return (<div className="vcard t2"><div className="top-band">{Logo}</div>
      <div className="percent-hero"><div className="pct-big">{discount}<span className="sym">%</span></div><div className="pct-sub">OFF · 비아엘리떼 특별가</div></div>
      <div className="product-area small">{img}</div>
      <div className="info c">{brandLine}<div className="product-name">{p.name}</div>
        <div className="price-row"><span className="price-o">{won(official)}원</span><span className="price-s">{won(sale)}<span className="w">원</span></span></div></div>{savingsBand}</div>);
  if (tpl === 5)
    return (<div className="vcard t5"><div className="top-band">{Logo}</div><div className="product-area">{img}</div>
      <div className="info c"><div className="excl">EXCLUSIVE PRICE</div><div className="brand-en">{p.brand}</div>
        <div className="product-name">{p.name}</div><div className="gold-div" /><div className="price-o">{won(official)}원</div>
        <div className="price-s">{won(sale)}<span className="w">원</span></div></div>{savingsBand}</div>);
  if (tpl === 8)
    return (<div className="vcard t8"><div className="top-band">{Logo}</div><div className="product-area">{img}</div>
      <div className="info c"><div className="hairline" /><div className="brand-en">{p.brand}</div>
        <div className="product-name">{p.name}</div>
        <div className="price-inline"><span>{won(official)}원</span><span className="sep">·</span><span className="sale-val">{won(sale)}원</span></div>
        <div className="pct-small">-{discount}%</div></div></div>);
  return (<div className="vcard t1"><div className="top-band">{Logo}</div>
    <div className="product-area"><div className="disc-badge">{discount}<span className="pct">%</span></div>{img}</div>
    <div className="info">{brandLine}<div className="product-name">{p.name}</div>
      <div className="po-row"><span className="po-label">공식 가격</span><span className="price-o">{won(official)}원</span></div>
      <div className="ps-row"><span className="ps-label">{priceLabel}</span><span className="price-s">{won(sale)}<span className="w">원</span></span></div></div>{savingsBand}</div>);
}

function ListCard({ items, title }: { items: CardProduct[]; title: string }) {
  return (
    <div className="vlist">
      <div className="vlist-top">{Logo}</div>
      <div className="vlist-title">{title}</div>
      <div className="vlist-body">
        {items.map((p) => {
          const official = p.listPrice ?? 0, sale = p.salePrice ?? official, d = disc(p);
          return (
            <div key={p.goodsNo} className="vlist-row">
              <div className="vlist-thumb">{p.image ? <img src={proxied(p.image)} alt="" crossOrigin="anonymous" /> : <span>이미지</span>}</div>
              <div className="vlist-info">
                <div className="vlist-brand">{p.brand}</div>
                <div className="vlist-name">{p.name}</div>
              </div>
              <div className="vlist-price">
                {d > 0 && <span className="vlist-badge">{d}%↓</span>}
                {official > 0 && <span className="vlist-o">{won(official)}원</span>}
                <span className="vlist-s">{won(sale)}원</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CSS = `
.vecard-root .vcard{width:480px;background:#fff;overflow:hidden;font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.12);color:#1c1c1c}
.vecard-root .top-band{display:flex;justify-content:center;padding:16px 0;background:#1c3829}
.vecard-root .ve-logo{color:#fff;font-family:Georgia,serif;letter-spacing:.26em;font-size:19px;font-weight:600}
.vecard-root .product-area{position:relative;height:480px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.vecard-root .product-area.small{height:300px;border-top:1px solid #ecebe6;border-bottom:1px solid #ecebe6}
.vecard-root .product-area img.prod{max-width:90%;max-height:90%;object-fit:contain}
.vecard-root .ph{color:#c0bdb3;font-size:14px}
.vecard-root .info{padding:24px 32px 20px;background:#faf9f5}
.vecard-root .info.c{text-align:center}
.vecard-root .brand-line{display:flex;align-items:baseline;gap:12px;margin-bottom:2px}
.vecard-root .info.c .brand-line{justify-content:center}
.vecard-root .brand-en{font-family:Georgia,serif;font-size:40px;font-weight:700;line-height:1.1}
.vecard-root .product-name{font-size:16px;color:#444;margin:2px 0 14px}
.vecard-root .po-row{display:flex;align-items:baseline;gap:10px}
.vecard-root .po-label{font-size:13px;color:#999}
.vecard-root .price-o{font-size:16px;color:#999;text-decoration:line-through;text-decoration-color:#c0392b}
.vecard-root .ps-row{margin-top:6px}
.vecard-root .ps-label{display:block;font-size:15px;color:#1c3829;font-weight:700;margin-bottom:4px}
.vecard-root .price-s{font-size:52px;font-weight:900;letter-spacing:-.025em;line-height:1}
.vecard-root .price-s .w{font-size:26px;font-weight:800;margin-left:4px}
.vecard-root .disc-badge{position:absolute;top:0;left:0;background:#1c3829;color:#fff;padding:20px 34px 20px 26px;border-bottom-right-radius:999px;display:flex;align-items:baseline;font-weight:900;font-size:56px;z-index:2}
.vecard-root .disc-badge .pct{font-size:26px;margin-left:4px}
.vecard-root .savings-band{background:#1c3829;color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between}
.vecard-root .savings-band .label{font-size:11px;letter-spacing:.2em;opacity:.85;text-transform:uppercase}
.vecard-root .savings-band .value{font-size:22px;font-weight:800}
.vecard-root .savings-band .value .w{font-size:14px;margin-left:2px}
.vecard-root .t2 .percent-hero{padding:36px 0 24px;text-align:center;background:#faf9f5}
.vecard-root .t2 .pct-big{font-family:Georgia,sans-serif;font-size:180px;font-weight:900;line-height:.85;color:#1c3829;letter-spacing:-.06em;display:inline-flex;align-items:baseline}
.vecard-root .t2 .pct-big .sym{font-size:100px;color:#c0392b;margin-left:4px}
.vecard-root .t2 .pct-sub{font-size:16px;font-weight:800;letter-spacing:.4em;color:#c0392b;margin-top:8px}
.vecard-root .t2 .price-row{display:flex;justify-content:center;gap:14px;align-items:baseline}
.vecard-root .t2 .price-s{font-size:32px}
.vecard-root .t2 .price-s .w{font-size:18px}
.vecard-root .t5{background:#0c0c0c;color:#e8e2d1}
.vecard-root .t5 .top-band{background:#0c0c0c;border-bottom:1px solid #2a2a2a}
.vecard-root .t5 .product-area{background:#161616}
.vecard-root .t5 .info{background:#0c0c0c}
.vecard-root .t5 .excl{font-size:11px;letter-spacing:.4em;color:#c9a96e;margin-bottom:14px}
.vecard-root .t5 .brand-en{font-size:44px;color:#e8e2d1;letter-spacing:.08em}
.vecard-root .t5 .product-name{color:#b5ad99}
.vecard-root .t5 .gold-div{width:60px;height:1px;background:#c9a96e;margin:12px auto 14px}
.vecard-root .t5 .price-o{color:#6e655a;margin-bottom:6px}
.vecard-root .t5 .price-s{font-size:34px;color:#c9a96e;font-weight:700}
.vecard-root .t5 .savings-band{background:#1a1a1a;color:#c9a96e;border-top:1px solid #2a2a2a}
.vecard-root .t5 .savings-band .label{color:#8a8174}
.vecard-root .t8,.vecard-root .t8 .product-area,.vecard-root .t8 .info{background:#faf9f5}
.vecard-root .t8 .top-band{background:transparent;padding:26px 0 6px}
.vecard-root .t8 .ve-logo{color:#1c3829}
.vecard-root .t8 .product-area{height:360px;padding:0 40px}
.vecard-root .t8 .hairline{width:100%;height:1px;background:#c9b88f;margin:4px 0 16px}
.vecard-root .t8 .brand-en{font-size:34px;font-weight:600;letter-spacing:.12em}
.vecard-root .t8 .product-name{font-style:italic;color:#666;font-size:13px}
.vecard-root .t8 .price-inline{display:flex;justify-content:center;gap:16px;align-items:baseline;color:#5a5a5a;font-size:15px}
.vecard-root .t8 .price-inline .sep{color:#c9b88f}
.vecard-root .t8 .price-inline .sale-val{font-weight:800;color:#1c3829;font-size:18px}
.vecard-root .t8 .pct-small{margin-top:8px;font-size:13px;color:#c0392b;font-weight:800;letter-spacing:.1em}
/* 리스트형 */
.vecard-root .vlist{width:480px;background:#fff;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.12);font-family:'Noto Sans KR',sans-serif}
.vecard-root .vlist-top{background:#1c3829;padding:15px 0;display:flex;justify-content:center}
.vecard-root .vlist-title{padding:20px 26px 16px;text-align:center;font-size:15px;font-weight:700;color:#1c3829;letter-spacing:.05em;border-bottom:1px solid #eee}
.vecard-root .vlist-body{padding:6px 22px 22px}
.vecard-root .vlist-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f0eee9}
.vecard-root .vlist-row:last-child{border-bottom:none}
.vecard-root .vlist-thumb{width:74px;height:74px;flex:none;background:#f5f3ed;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#c0bdb3;font-size:10px}
.vecard-root .vlist-thumb img{width:100%;height:100%;object-fit:cover}
.vecard-root .vlist-info{flex:1;min-width:0}
.vecard-root .vlist-brand{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#1c1c1c}
.vecard-root .vlist-name{font-size:12px;color:#777;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vecard-root .vlist-price{text-align:right;flex:none}
.vecard-root .vlist-badge{display:inline-block;background:#fbe9e6;color:#c0392b;font-size:11px;font-weight:800;padding:2px 7px;border-radius:3px;margin-bottom:4px}
.vecard-root .vlist-o{display:block;font-size:12px;color:#aaa;text-decoration:line-through;text-decoration-color:#c0392b}
.vecard-root .vlist-s{display:block;font-size:19px;font-weight:900;color:#1c1c1c;letter-spacing:-.02em}
`;
