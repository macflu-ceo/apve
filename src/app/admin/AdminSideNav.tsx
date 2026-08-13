"use client";

// 좌측 사이드바 — 현재 선택된 대분류(그룹)의 하위 메뉴만 표시.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeGroupName, isActivePath, type MenuGroup } from "./nav-types";

export default function AdminSideNav({ groups }: { groups: MenuGroup[] }) {
  const pathname = usePathname();
  const activeName = activeGroupName(pathname, groups) ?? groups[0].group;
  const group = groups.find((g) => g.group === activeName) ?? groups[0];

  return (
    <nav className="flex flex-col gap-0.5">
      <div className="mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-ink/40">{group.group}</div>
      {group.items.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            isActivePath(pathname, m.href) ? "bg-brand text-white" : "text-ink/80 hover:bg-white hover:text-ink"
          }`}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
