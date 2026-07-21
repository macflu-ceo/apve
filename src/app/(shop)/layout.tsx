import Link from "next/link";
import { getSiteSetting } from "@/lib/settings";
import { getSessionPartner } from "@/lib/auth";
import AuthModalProvider from "@/components/auth/AuthModalProvider";
import AuthNav from "@/components/auth/AuthNav";

const TABS = [
  { href: "/", label: "추천상품" },
  { href: "/board", label: "공지/가이드" },
  { href: "/concierge", label: "멤버십 업그레이드" },
];

function SearchBar() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#f5f3f0] px-4 py-2.5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-sub">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input placeholder="브랜드, 상품 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-sub" />
    </div>
  );
}

function TopIcon({ path, label, href }: { path: string; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 text-[11px] text-ink/70">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

function BottomTab({ path, label, href }: { path: string; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-ink/70">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [setting, partner] = await Promise.all([getSiteSetting(), getSessionPartner()]);
  return (
    <AuthModalProvider>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex max-w-shell items-center gap-6 px-4 py-3">
          <Link href="/" className="shrink-0">
            <span className="text-[22px] font-black tracking-tight text-brand md:text-[24px]">{setting.siteName}</span>
          </Link>

          <nav className="hidden lg:block">
            <ul className="flex gap-6 text-[15px] font-bold">
              {TABS.map((t, i) => (
                <li key={i}>
                  <Link
                    href={t.href}
                    className={i === 0 ? "border-b-2 border-brand pb-1 text-ink" : "pb-1 text-ink/70 hover:text-ink"}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto hidden min-w-[240px] flex-1 md:block lg:max-w-sm">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-4 md:ml-0">
            <TopIcon href="/category" label="카테고리" path="M4 6h16M4 12h16M4 18h16" />
            <AuthNav name={partner?.name ?? null} />
          </div>
        </div>

        {/* 검색 (모바일) */}
        <div className="px-4 pb-2 md:hidden">
          <SearchBar />
        </div>

        {/* 탭 (모바일/태블릿) */}
        <nav className="lg:hidden">
          <ul className="no-scrollbar flex gap-5 overflow-x-auto px-4 pb-2 text-[15px] font-bold">
            {TABS.map((t, i) => (
              <li key={i} className="whitespace-nowrap">
                <Link href={t.href} className={i === 0 ? "border-b-2 border-brand pb-1" : "pb-1 text-ink/70"}>
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-shell pb-24 md:pb-0">{children}</main>

      {/* 하단 탭바 (모바일 전용) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden">
        <div className="mx-auto grid max-w-shell grid-cols-4">
          <BottomTab href="/" label="홈" path="M3 11l9-8 9 8M5 10v10h14V10" />
          <BottomTab href="/category" label="카테고리" path="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
          <BottomTab href="/me" label="찜" path="M12 21s-7-4.5-9.5-8.5A5 5 0 0112 6a5 5 0 019.5 6.5C19 16.5 12 21 12 21z" />
          <BottomTab href="/me" label="내정보" path="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
        </div>
      </nav>

      <footer className="mt-16 border-t border-line pb-20 md:pb-0">
        <div className="mx-auto max-w-shell px-4 py-10 text-xs leading-relaxed text-sub">
          <div className="mb-2 text-base font-black text-brand">{setting.siteName}</div>
          {setting.companyName}
          {setting.businessNo ? ` · 사업자 ${setting.businessNo}` : ""} · {setting.footerNote}
          {setting.contact ? (
            <>
              <br />
              {setting.contact}
            </>
          ) : null}
        </div>
      </footer>
    </AuthModalProvider>
  );
}
