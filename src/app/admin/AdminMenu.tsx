"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MenuItem = { href: string; label: string };
export type MenuGroup = { group: string; items: MenuItem[] };

/** 상단 가로 메뉴바 — 그룹별 드롭다운. (기존 좌측 세로 사이드바 대체) */
export default function AdminMenu({ groups }: { groups: MenuGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // 경로 바뀌면 닫기
  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <nav ref={ref} className="flex flex-wrap items-center gap-1">
      {groups.map((g) => {
        const hasActive = g.items.some((i) => isActive(i.href));
        const isOpen = open === g.group;
        // 단일 항목 그룹(설정 등)은 드롭다운 없이 바로 링크
        if (g.items.length === 1) {
          const m = g.items[0];
          return (
            <Link
              key={g.group}
              href={m.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                isActive(m.href) ? "bg-brand text-white" : "text-ink/70 hover:bg-white hover:text-ink"
              }`}
            >
              {m.label}
            </Link>
          );
        }
        return (
          <div key={g.group} className="relative">
            <button
              onClick={() => setOpen(isOpen ? null : g.group)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                hasActive || isOpen ? "bg-brand text-white" : "text-ink/70 hover:bg-white hover:text-ink"
              }`}
            >
              {g.group}
              <span className={`text-[10px] opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
            {isOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[210px] rounded-xl border border-line bg-white p-1.5 shadow-lg">
                {g.items.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive(m.href) ? "bg-brand text-white" : "text-ink/80 hover:bg-[#f7f6f4]"
                    }`}
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
