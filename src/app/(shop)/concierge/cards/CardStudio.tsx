"use client";

import { useRef, useState } from "react";
import { searchCardProducts, type CardProduct } from "./actions";

const won = (n: number) => n.toLocaleString("ko-KR");
const proxied = (u: string | null) => (u ? `/api/img-proxy?url=${encodeURIComponent(u)}` : "");

const TEMPLATES = [
  { id: 1, label: "클래식 가격형" },
  { id: 2, label: "할인율 영웅형" },
  { id: 5, label: "럭셔리 다크" },
  { id: 8, label: "미니멀 시그니처" },
];

export default function CardStudio() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CardProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [tpl, setTpl] = useState(1);
  const [f, setF] = useState({
    brand: "Moncler",
    brandKr: "몽클레어",
    name: "MAYA 다운 자켓",
    official: 3100000,
    sale: 2047650,
    priceLabel: "비아엘리떼 컨시어지 가",
    image: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const cardRef = useRef<HTMLDivElement>(null);

  const discount = f.official > 0 && f.sale > 0 && f.official > f.sale ? Math.round(((f.official - f.sale) / f.official) * 100) : 0;
  const savings = Math.max(f.official - f.sale, 0);

  async function doSearch() {
    if (!q.trim()) return;
    setSearching(true);
    setResults(await searchCardProducts(q));
    setSearching(false);
  }

  function pick(p: CardProduct) {
    setF((prev) => ({
      ...prev,
      brand: p.brand || prev.brand,
      name: p.name,
      official: p.listPrice ?? prev.official,
      sale: p.salePrice ?? prev.sale,
      image: proxied(p.image),
    }));
    setResults([]);
    setQ("");
  }

  async function download() {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `viaelite_${f.brand}_${Date.now()}.png`.replace(/\s+/g, "_");
    a.click();
  }

  return (
    <div className="vecard-root grid gap-6 lg:grid-cols-[380px_1fr]">
      <style>{CSS}</style>

      {/* 입력 */}
      <div className="space-y-4">
        {/* 상품 검색 → 자동채움 */}
        <div className="card p-4">
          <div className="mb-2 text-sm font-bold">상품 불러오기 (자동채움)</div>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="브랜드·상품명 검색"
              className="field flex-1"
            />
            <button onClick={doSearch} className="rounded-lg bg-ink px-4 text-sm font-bold text-white">
              {searching ? "…" : "검색"}
            </button>
          </div>
          {results.length > 0 && (
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {results.map((p) => (
                <li key={p.goodsNo}>
                  <button onClick={() => pick(p)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-brandsoft">
                    {p.image && <img src={proxied(p.image)} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.brand} {p.name}</span>
                      <span className="text-xs text-sub">{p.salePrice ? `${won(p.salePrice)}원` : ""}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 편집 */}
        <div className="card space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label="브랜드"><input className="field" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
            <Field label="브랜드(한글)"><input className="field" value={f.brandKr} onChange={(e) => set("brandKr", e.target.value)} /></Field>
          </div>
          <Field label="상품명"><input className="field" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="공식가"><input type="number" className="field" value={f.official} onChange={(e) => set("official", +e.target.value)} /></Field>
            <Field label="판매가"><input type="number" className="field" value={f.sale} onChange={(e) => set("sale", +e.target.value)} /></Field>
          </div>
          <Field label="판매가 라벨"><input className="field" value={f.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} /></Field>
          <div className="rounded-lg bg-brandsoft px-3 py-2 text-sm">
            할인율 <b className="text-red-500">{discount}%</b> · 고객 할인 <b>{won(savings)}원</b>
          </div>
          <label className="text-xs text-sub">상품 이미지 직접 업로드(선택)</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) set("image", URL.createObjectURL(file));
          }} className="text-sm" />
        </div>

        {/* 템플릿 */}
        <div className="card p-4">
          <div className="mb-2 text-sm font-bold">템플릿</div>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setTpl(t.id)} className={`rounded-lg border px-3 py-2 text-sm ${tpl === t.id ? "border-brand bg-brandsoft font-bold text-brand" : "border-line"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={download} className="btn-primary mt-3 w-full rounded-lg py-3 text-sm font-bold">PNG로 저장 (2x)</button>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="flex justify-center overflow-x-auto">
        <div ref={cardRef}>
          <Card tpl={tpl} f={f} discount={discount} savings={savings} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-sub">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Card({ tpl, f, discount, savings }: { tpl: number; f: any; discount: number; savings: number }) {
  const Logo = <div className="ve-logo">VIA ÉLITE</div>;
  const img = f.image ? <img className="prod" src={f.image} alt="" crossOrigin="anonymous" /> : <div className="ph">상품 이미지</div>;
  const brandLine = (
    <div className="brand-line">
      <span className="brand-en">{f.brand}</span>
      {f.brandKr && <span className="brand-kr">{f.brandKr}</span>}
    </div>
  );
  const savingsBand = (
    <div className="savings-band"><span className="label">고객 할인 금액</span><span className="value">{won(savings)}<span className="w">원</span></span></div>
  );

  if (tpl === 2)
    return (
      <div className="vcard t2">
        <div className="top-band">{Logo}</div>
        <div className="percent-hero"><div className="pct-big">{discount}<span className="sym">%</span></div><div className="pct-sub">OFF · 비아엘리떼 특별가</div></div>
        <div className="product-area small">{img}</div>
        <div className="info c">{brandLine}<div className="product-name">{f.name}</div>
          <div className="price-row"><span className="price-o">{won(f.official)}원</span><span className="price-s">{won(f.sale)}<span className="w">원</span></span></div>
        </div>{savingsBand}
      </div>
    );
  if (tpl === 5)
    return (
      <div className="vcard t5">
        <div className="top-band">{Logo}</div>
        <div className="product-area">{img}</div>
        <div className="info c">
          <div className="excl">EXCLUSIVE PRICE</div>
          <div className="brand-en">{f.brand}</div><div className="brand-kr">{f.brandKr}</div>
          <div className="product-name">{f.name}</div><div className="gold-div" />
          <div className="price-o">{won(f.official)}원</div>
          <div className="price-s">{won(f.sale)}<span className="w">원</span></div>
        </div>{savingsBand}
      </div>
    );
  if (tpl === 8)
    return (
      <div className="vcard t8">
        <div className="top-band">{Logo}</div>
        <div className="product-area">{img}</div>
        <div className="info c">
          <div className="hairline" />
          <div className="brand-en">{f.brand}</div><div className="brand-kr">{f.brandKr}</div>
          <div className="product-name">{f.name}</div>
          <div className="price-inline"><span>{won(f.official)}원</span><span className="sep">·</span><span className="sale-val">{won(f.sale)}원</span></div>
          <div className="pct-small">-{discount}%</div>
        </div>
      </div>
    );
  // t1 (기본)
  return (
    <div className="vcard t1">
      <div className="top-band">{Logo}</div>
      <div className="product-area"><div className="disc-badge">{discount}<span className="pct">%</span></div>{img}</div>
      <div className="info">{brandLine}<div className="product-name">{f.name}</div>
        <div className="po-row"><span className="po-label">공식 가격</span><span className="price-o">{won(f.official)}원</span></div>
        <div className="ps-row"><span className="ps-label">{f.priceLabel}</span><span className="price-s">{won(f.sale)}<span className="w">원</span></span></div>
      </div>{savingsBand}
    </div>
  );
}

const CSS = `
.vecard-root .vcard{width:480px;background:#fff;overflow:hidden;font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.12);color:#1c1c1c}
.vecard-root .top-band{display:flex;justify-content:center;padding:16px 0;background:#1c3829}
.vecard-root .ve-logo{color:#fff;font-family:Georgia,'Cormorant Garamond',serif;letter-spacing:.26em;font-size:19px;font-weight:600}
.vecard-root .product-area{position:relative;height:480px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.vecard-root .product-area.small{height:300px;border-top:1px solid #ecebe6;border-bottom:1px solid #ecebe6}
.vecard-root .product-area img.prod{max-width:90%;max-height:90%;object-fit:contain}
.vecard-root .ph{color:#c0bdb3;font-size:14px}
.vecard-root .info{padding:24px 32px 20px;background:#faf9f5}
.vecard-root .info.c{text-align:center}
.vecard-root .brand-line{display:flex;align-items:baseline;gap:12px;margin-bottom:2px}
.vecard-root .info.c .brand-line{justify-content:center}
.vecard-root .brand-en{font-family:Georgia,'Cormorant Garamond',serif;font-size:40px;font-weight:700;line-height:1.1}
.vecard-root .brand-kr{font-size:15px;color:#777}
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
/* t2 */
.vecard-root .t2 .percent-hero{padding:36px 0 24px;text-align:center;background:#faf9f5}
.vecard-root .t2 .pct-big{font-family:Georgia,sans-serif;font-size:180px;font-weight:900;line-height:.85;color:#1c3829;letter-spacing:-.06em;display:inline-flex;align-items:baseline}
.vecard-root .t2 .pct-big .sym{font-size:100px;color:#c0392b;margin-left:4px}
.vecard-root .t2 .pct-sub{font-size:16px;font-weight:800;letter-spacing:.4em;color:#c0392b;margin-top:8px}
.vecard-root .t2 .price-row{display:flex;justify-content:center;gap:14px;align-items:baseline}
.vecard-root .t2 .price-s{font-size:32px}
.vecard-root .t2 .price-s .w{font-size:18px}
/* t5 */
.vecard-root .t5{background:#0c0c0c;color:#e8e2d1}
.vecard-root .t5 .top-band{background:#0c0c0c;border-bottom:1px solid #2a2a2a}
.vecard-root .t5 .product-area{background:#161616}
.vecard-root .t5 .info{background:#0c0c0c}
.vecard-root .t5 .excl{font-size:11px;letter-spacing:.4em;color:#c9a96e;margin-bottom:14px}
.vecard-root .t5 .brand-en{font-size:44px;color:#e8e2d1;letter-spacing:.08em}
.vecard-root .t5 .brand-kr{color:#8a8174;letter-spacing:.15em}
.vecard-root .t5 .product-name{color:#b5ad99}
.vecard-root .t5 .gold-div{width:60px;height:1px;background:#c9a96e;margin:12px auto 14px}
.vecard-root .t5 .price-o{color:#6e655a;margin-bottom:6px}
.vecard-root .t5 .price-s{font-size:34px;color:#c9a96e;font-weight:700}
.vecard-root .t5 .savings-band{background:#1a1a1a;color:#c9a96e;border-top:1px solid #2a2a2a}
.vecard-root .t5 .savings-band .label{color:#8a8174}
/* t8 */
.vecard-root .t8,.vecard-root .t8 .product-area,.vecard-root .t8 .info{background:#faf9f5}
.vecard-root .t8 .top-band{background:transparent;padding:26px 0 6px}
.vecard-root .t8 .ve-logo{color:#1c3829}
.vecard-root .t8 .product-area{height:360px;padding:0 40px}
.vecard-root .t8 .hairline{width:100%;height:1px;background:#c9b88f;margin:4px 0 16px}
.vecard-root .t8 .brand-en{font-size:34px;font-weight:600;letter-spacing:.12em}
.vecard-root .t8 .brand-kr{font-size:12px;letter-spacing:.2em;color:#888}
.vecard-root .t8 .product-name{font-style:italic;color:#666;font-size:13px}
.vecard-root .t8 .price-inline{display:flex;justify-content:center;gap:16px;align-items:baseline;color:#5a5a5a;font-size:15px}
.vecard-root .t8 .price-inline .sep{color:#c9b88f}
.vecard-root .t8 .price-inline .sale-val{font-weight:800;color:#1c3829;font-size:18px}
.vecard-root .t8 .pct-small{margin-top:8px;font-size:13px;color:#c0392b;font-weight:800;letter-spacing:.1em}
`;
