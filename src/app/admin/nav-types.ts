export type MenuItem = { href: string; label: string };
export type MenuGroup = { group: string; items: MenuItem[] };

/** 현재 경로가 이 항목에 해당하는지 (/admin은 정확히 일치할 때만) */
export function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** 현재 경로가 속한 대분류(그룹) 이름 */
export function activeGroupName(pathname: string, groups: MenuGroup[]): string | null {
  const g = groups.find((grp) => grp.items.some((i) => isActivePath(pathname, i.href)));
  return g?.group ?? null;
}
