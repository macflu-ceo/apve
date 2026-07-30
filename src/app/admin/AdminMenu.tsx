"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MenuItem = { href: string; label: string };
export type MenuGroup = { group: string; items: MenuItem[] };

const KEY = "admin-menu-collapsed-v1";

export default function AdminMenu({ groups }: { groups: MenuGroup[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // 저장된 접힘 상태 로드
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
      if (Array.isArray(saved)) setCollapsed(new Set(saved));
    } catch {
      /* 무시 */
    }
  }, []);

  function toggle(group: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        /* 무시 */
      }
      return next;
    });
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-3">
      {groups.map((g) => {
        const hasActive = g.items.some((i) => isActive(i.href));
        const open = !collapsed.has(g.group) || hasActive; // 현재 페이지가 든 그룹은 항상 펼침
        return (
          <div key={g.group}>
            <button
              onClick={() => toggle(g.group)}
              className="mb-1 flex w-full items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wide text-ink/40 hover:text-ink/70"
            >
              <span>{g.group}</span>
              <span className={`transition-transform ${open ? "" : "-rotate-90"}`}>⌄</span>
            </button>
            {open && (
              <div className="flex flex-col gap-0.5">
                {g.items.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive(m.href) ? "bg-brand text-white" : "text-ink/80 hover:bg-white hover:text-ink"
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
