"use client";

// 상단 대분류(그룹) 바 — godomall처럼 위에서 큰 카테고리를 나눈다.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeGroupName, type MenuGroup } from "./nav-types";

export default function AdminTopNav({ groups }: { groups: MenuGroup[] }) {
  const pathname = usePathname();
  const active = activeGroupName(pathname, groups);

  return (
    <nav className="flex flex-wrap items-center gap-0.5">
      {groups.map((g) => {
        const on = g.group === active;
        return (
          <Link
            key={g.group}
            href={g.items[0].href}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
              on ? "bg-brand text-white" : "text-ink/70 hover:bg-white hover:text-ink"
            }`}
          >
            {g.group}
          </Link>
        );
      })}
    </nav>
  );
}
