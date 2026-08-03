import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "주식회사 제이프리모인터내셔널 | 돈버는 명품샵",
  description: "이탈리아 부티크와 직접 계약한 명품 유통 전문 기업. 재고·물류·소싱 부담 없이 링크만 공유하고 수수료를 버세요.",
};

const GOLD = "#e3b24a";
const DARK = "#1b1714";

const STATS = [
  { n: "32", u: "개+", l: "직계약 이탈리아 부티크" },
  { n: "118", u: "만+", l: "즉시 판매 가능 상품" },
  { n: "70", u: "%", l: "정가 대비 최대 할인" },
  { n: "40", u: "만+", l: "소싱 가능 전체 상품" },
  { n: "50", u: "억+", l: "국내 보유 재고" },
  { n: "120", u: "개+", l: "온라인 유통 파트너" },
];

const CARDS = [
  { img: "/landing/company_sourcing.jpg", tag: "DIRECT FROM ITALY", title: "이탈리아 부티크 직계약",
    body: "32개+ 현지 부티크와 직접 계약하고 재고를 API로 실시간 연동. 118만 개+ 정품을 곧바로 판매합니다." },
  { img: "/landing/company_authentic.jpg", tag: "100% AUTHENTIC", title: "모든 상품은 100% 정품",
    body: "부티크에서 고객까지 유통 경로를 직접 관리합니다. 가품이 끼어들 틈이 없는 구조예요." },
  { img: "/landing/company_share.jpg", tag: "YOU JUST SHARE", title: "이 인프라를, 이제 개인에게",
    body: "재고·물류·응대는 전부 본사가. 당신은 링크만 공유하면 수수료가 쌓입니다. 무재고·무자본." },
];

const NOTES = [
  "돈버는 명품샵은 주식회사 제이프리모인터내셔널이 운영합니다.",
  "모든 상품은 이탈리아 부티크에서 직수입한 100% 정품입니다.",
  "재고 매입·물류·고객 응대는 본사가 처리하며, 회원은 링크 공유로 수수료를 받습니다.",
  "수수료율·정산 기준 등 상세 내용은 공지사항을 참고해 주세요.",
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: DARK }} className="text-white">
      {/* 1. 히어로 */}
      <section className="px-6 pb-10 pt-14 text-center md:pt-20">
        <div className="text-xs font-black tracking-[0.3em]" style={{ color: GOLD }}>J PRIMO INTERNATIONAL</div>
        <h1 className="mt-4 text-4xl font-black leading-[1.15] md:text-6xl">
          5년간 명품만,<br />
          <span style={{ color: GOLD }}>이탈리아</span>에서 직접
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-medium text-white/60 md:text-base">
          중간 유통 없이 이탈리아 부티크와 직접 계약한 명품 유통 전문 기업.
          그 인프라를 이제 당신의 판매로 연결합니다.
        </p>
        <div
          className="mx-auto mt-8 aspect-[16/10] w-full max-w-lg rounded-2xl bg-cover bg-center shadow-2xl ring-1 ring-white/10"
          style={{ backgroundImage: "url(/landing/company_hero.jpg)" }}
        />
      </section>

      {/* 2. 신뢰 수치 (스탯) */}
      <section className="px-5 py-10">
        <div className="mx-auto max-w-lg rounded-3xl p-6 md:p-8" style={{ backgroundColor: "#221d18", border: `1px solid ${GOLD}33` }}>
          <div className="text-center text-sm font-black tracking-widest" style={{ color: GOLD }}>NUMBERS</div>
          <h2 className="mt-1 text-center text-2xl font-black text-white">숫자로 증명하는 신뢰</h2>
          <div className="mt-6 grid grid-cols-3 gap-y-7">
            {STATS.map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-black leading-none md:text-4xl">
                  {s.n}<span className="text-lg align-top" style={{ color: GOLD }}>{s.u}</span>
                </div>
                <div className="mx-auto mt-2 max-w-[6.5rem] text-[11px] font-semibold leading-tight text-white/55">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 혜택 카드 */}
      <section className="space-y-5 px-5 py-6">
        <h2 className="text-center text-2xl font-black">왜 제이프리모인가</h2>
        <div className="mx-auto max-w-lg space-y-5">
          {CARDS.map((c) => (
            <div key={c.title} className="overflow-hidden rounded-3xl" style={{ backgroundColor: "#221d18", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="aspect-[16/9] w-full bg-cover bg-center" style={{ backgroundImage: `url(${c.img})` }} />
              <div className="p-6">
                <div className="text-[11px] font-black tracking-widest" style={{ color: GOLD }}>{c.tag}</div>
                <h3 className="mt-1.5 text-xl font-black text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CTA */}
      <section className="px-6 py-12 text-center">
        <h2 className="text-3xl font-black leading-tight md:text-4xl">
          지금, <span style={{ color: GOLD }}>명품 판매</span>를 시작하세요
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-white/60">
          가입하고 마음에 드는 상품을 공유하는 순간, 당신의 수익이 시작됩니다.
        </p>
        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3">
          <Link href="/me" className="rounded-full px-8 py-4 text-base font-black text-[#1b1714] shadow-lg transition active:scale-[0.98]" style={{ backgroundColor: GOLD }}>
            회원가입하고 판매 시작 →
          </Link>
          <Link href="/category" className="rounded-full border border-white/25 px-8 py-4 text-base font-bold text-white transition hover:bg-white/5">
            상품 먼저 둘러보기
          </Link>
        </div>
      </section>

      {/* 5. 안내 (유의사항 느낌) */}
      <section className="px-6 pb-16 pt-4">
        <div className="mx-auto max-w-lg border-t border-white/10 pt-6">
          <div className="text-sm font-bold text-white/70">안내</div>
          <ul className="mt-3 space-y-2">
            {NOTES.map((n, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-white/45">
                <span style={{ color: GOLD }}>·</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-xs font-bold text-white/40">주식회사 제이프리모인터내셔널</div>
        </div>
      </section>
    </div>
  );
}
