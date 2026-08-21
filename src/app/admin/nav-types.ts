export type MenuItem = { href: string; label: string };
export type MenuGroup = { group: string; items: MenuItem[] };

/** 현재 경로가 이 항목에 해당하는지 (/admin은 정확히 일치할 때만) */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  // 경로 경계 매칭 — /admin/concierge 가 /admin/concierge-members 에 잘못 매칭되지 않게
  return pathname === href || pathname.startsWith(href + "/");
}

/** 현재 경로가 속한 대분류(그룹) 이름 */
export function activeGroupName(pathname: string, groups: MenuGroup[]): string | null {
  const g = groups.find((grp) => grp.items.some((i) => isActivePath(pathname, i.href)));
  return g?.group ?? null;
}
