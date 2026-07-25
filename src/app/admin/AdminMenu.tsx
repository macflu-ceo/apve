"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MenuItem = { href: string; label: string };

const KEY = "admin-menu-order-v1";

/** 저장된 순서를 기본 목록에 반영 (새 메뉴는 뒤에 붙이고, 없어진 건 제거) */
function applyOrder(items: MenuItem[], saved: string[]): MenuItem[] {
  const byHref = new Map(items.map((i) => [i.href, i]));
  const ordered = saved.map((h) => byHref.get(h)).filter(Boolean) as MenuItem[];
  const missing = items.filter((i) => !saved.includes(i.href));
  return [...ordered, ...missing];
}

export default function AdminMenu({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();
  const [order, setOrder] = useState<MenuItem[]>(items);
  const [editing, setEditing] = useState(false);

  // 초기 로드: 저장된 순서 반영
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
      if (Array.isArray(saved) && saved.length) setOrder(applyOrder(items, saved));
    } catch {
      /* 무시 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: MenuItem[]) {
    setOrder(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.map((i) => i.href)));
    } catch {
      /* 무시 */
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[idx], next[j]] = [next[j], next[idx]];
    persist(next);
  }

  function reset() {
    setOrder(items);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* 무시 */
    }
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-ink/40">메뉴</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <button onClick={reset} className="text-[11px] text-ink/50 hover:text-ink">
              기본순서
            </button>
            <button onClick={() => setEditing(false)} className="text-[11px] font-bold text-brand">
              완료
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-[11px] text-ink/50 hover:text-ink">
            ↕ 순서편집
          </button>
        )}
      </div>

      {order.map((m, i) => (
        <div key={m.href} className="flex items-center gap-1">
          {editing && (
            <div className="flex flex-col">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="leading-none text-ink/40 hover:text-ink disabled:opacity-20"
                aria-label="위로"
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                className="leading-none text-ink/40 hover:text-ink disabled:opacity-20"
                aria-label="아래로"
              >
                ▼
              </button>
            </div>
          )}
          {editing ? (
            <span className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-ink/80">
              {m.label}
            </span>
          ) : (
            <Link
              href={m.href}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(m.href) ? "bg-brand text-white" : "text-ink/80 hover:bg-white hover:text-ink"
              }`}
            >
              {m.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
