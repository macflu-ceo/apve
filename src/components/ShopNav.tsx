"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type Tab = { href: string; label: string };

/** 현재 URL이 그 탭에 해당하는지 (쿼리스트링까지 비교) */
function useIsActive() {
  const pathname = usePathname();
  const sp = useSearchParams();

  return (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return true;
    // /board?category=공지 처럼 쿼리가 붙은 탭은 값까지 일치해야 활성
    const want = new URLSearchParams(query);
    for (const [k, v] of Array.from(want.entries())) {
      if (sp.get(k) !== v) return false;
    }
    return true;
  };
}

/** 상단 메뉴 (데스크톱) */
export function ShopNav({ tabs }: { tabs: Tab[] }) {
  const isActive = useIsActive();
  return (
    <nav className="hidden">
      <ul className="flex gap-6 text-[15px] font-bold">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className={
                isActive(t.href)
                  ? "border-b-2 border-brand pb-1 text-ink"
                  : "border-b-2 border-transparent pb-1 text-ink/50 hover:text-ink"
              }
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 상단 메뉴 (모바일·태블릿) */
export function ShopNavMobile({ tabs }: { tabs: Tab[] }) {
  const isActive = useIsActive();
  return (
    <nav className="">
      <ul className="no-scrollbar flex gap-5 overflow-x-auto px-4 pb-2 text-[15px] font-bold">
        {tabs.map((t) => (
          <li key={t.href} className="whitespace-nowrap">
            <Link
              href={t.href}
              className={
                isActive(t.href)
                  ? "border-b-2 border-brand pb-1 text-ink"
                  : "border-b-2 border-transparent pb-1 text-ink/50"
              }
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
