import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "주식회사 제이프리모인터내셔널 | 돈버는 명품샵",
  description: "이탈리아 부티크와 직접 계약한 명품 유통 전문 기업. 재고·물류·소싱 부담 없이 링크만 공유하고 수수료를 버세요.",
};

const STATS = [
  { n: "32개+", l: "직계약 이탈리아 부티크" },
  { n: "118만개+", l: "즉시 판매 가능 상품" },
  { n: "최대 70%", l: "정가 대비 공급가 할인" },
  { n: "40만개+", l: "소싱 가능한 전체 상품" },
  { n: "50억+", l: "국내 보유 재고" },
  { n: "120개+", l: "온라인 유통 파트너" },
];

// 섹션 이미지 (public/landing/*)
const IMG = {
  hero: "/landing/company_hero.png",
  sourcing: "/landing/company_sourcing.png",
  authentic: "/landing/company_authentic.png",
  share: "/landing/company_share.png",
};

function Feature({ img, tag, title, body, reverse }: { img: string; tag: string; title: string; body: React.ReactNode; reverse?: boolean }) {
  return (
    <div className={`flex flex-col gap-6 md:items-center md:gap-10 ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}>
      <div className="md:w-1/2">
        <div
          className="aspect-[4/3] w-full rounded-xl2 bg-brandsoft bg-cover bg-center shadow-sm"
          style={{ backgroundImage: `url(${img})` }}
        />
      </div>
      <div className="md:w-1/2">
        <div className="text-xs font-black tracking-widest text-brand">{tag}</div>
        <h3 className="mt-2 text-2xl font-black leading-snug text-ink md:text-3xl">{title}</h3>
        <div className="mt-3 text-[15px] leading-relaxed text-ink/70">{body}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="pb-4">
      {/* 1. 히어로 */}
      <section
        className="relative flex min-h-[560px] flex-col justify-end bg-cover bg-center px-6 pb-12 pt-24 md:min-h-[640px] md:px-12"
        style={{ backgroundImage: `url(${IMG.hero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative max-w-2xl text-white">
          <div className="text-sm font-bold tracking-widest text-white/80">주식회사 제이프리모인터내셔널</div>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
            5년간 명품만,<br />이탈리아에서 직접
          </h1>
          <p className="mt-4 text-base font-medium text-white/85 md:text-lg">
            중간 유통 없이 이탈리아 부티크와 직접 계약한 명품 유통 전문 기업.<br className="hidden md:block" />
            그 인프라를 이제 당신의 판매로 연결합니다.
          </p>
        </div>
      </section>

      {/* 2. 인트로 문장 */}
      <section className="bg-brandsoft px-6 py-14 text-center md:py-20">
        <p className="mx-auto max-w-2xl text-xl font-bold leading-relaxed text-ink md:text-2xl">
          돈버는 명품샵은 <span className="text-brand">주식회사 제이프리모인터내셔널</span>이 운영합니다.
          재고도, 물류도, 소싱도 본사가 책임집니다. 당신은 링크만 공유하면 됩니다.
        </p>
      </section>

      {/* 3. 신뢰 수치 */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-black text-ink md:text-3xl">숫자로 보는 신뢰</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-xl2 border border-line bg-white p-5 text-center md:p-7">
                <div className="text-3xl font-black text-brand md:text-4xl">{s.n}</div>
                <div className="mt-1.5 text-xs font-semibold text-ink/60 md:text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4~6. 스토리 */}
      <section className="space-y-16 px-6 py-6 md:space-y-24 md:py-10">
        <div className="mx-auto max-w-4xl">
          <Feature
            img={IMG.sourcing}
            tag="DIRECT FROM ITALY"
            title="이탈리아 부티크와 직접 계약"
            body={
              <>
                32개 이상의 이탈리아 현지 부티크와 직접 계약하고, 재고 데이터를 <b className="text-ink">API로 실시간 연동</b>받습니다.
                어떤 상품이 있는지 즉시 파악해, 118만 개 이상의 정품 명품을 곧바로 판매할 수 있습니다.
              </>
            }
          />
        </div>
        <div className="mx-auto max-w-4xl">
          <Feature
            img={IMG.authentic}
            reverse
            tag="100% AUTHENTIC"
            title="모든 상품은 100% 정품"
            body={
              <>
                부티크에서 본사, 본사에서 고객까지 <b className="text-ink">모든 유통 경로를 직접 관리</b>합니다.
                가품이 끼어들 틈이 없는 구조 — 그래서 자신 있게 &quot;100% 정품 직수입&quot;이라고 말합니다.
              </>
            }
          />
        </div>
        <div className="mx-auto max-w-4xl">
          <Feature
            img={IMG.share}
            tag="YOU JUST SHARE"
            title="이 인프라를, 이제 개인에게"
            body={
              <>
                재고 사입도, 배송도, 고객 응대도 전부 본사가 합니다. 당신이 할 일은 마음에 드는 상품의 <b className="text-ink">링크를 공유하는 것</b> 하나.
                판매가 이뤄지면 수수료가 쌓입니다. 무재고·무자본으로 명품 판매를 시작하세요.
              </>
            }
          />
        </div>
      </section>

      {/* 7. 회사 정보 */}
      <section className="mt-6 bg-ink px-6 py-14 text-center text-white md:py-16">
        <div className="text-xs font-bold tracking-widest text-white/60">COMPANY</div>
        <div className="mt-2 text-2xl font-black md:text-3xl">주식회사 제이프리모인터내셔널</div>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
          이탈리아 부티크 직수입부터 물류 대행, 소싱 데이터까지. 명품 유통의 전 과정을 책임지는 전문 기업입니다.
        </p>
      </section>

      {/* 8. CTA */}
      <section className="bg-brand px-6 py-16 text-center text-white md:py-20">
        <h2 className="text-3xl font-black leading-tight md:text-4xl">지금, 명품 판매를 시작하세요</h2>
        <p className="mx-auto mt-3 max-w-md text-base text-white/85">
          가입하고 마음에 드는 상품을 공유하는 순간, 당신의 수익이 시작됩니다.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/me"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-black text-brand shadow-sm transition hover:bg-white/90"
          >
            회원가입하고 판매 시작
          </Link>
          <Link
            href="/category"
            className="inline-flex items-center justify-center rounded-xl border border-white/60 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
          >
            상품 먼저 둘러보기
          </Link>
        </div>
      </section>
    </div>
  );
}
