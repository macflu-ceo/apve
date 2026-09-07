/**
 * 멀티링크 샵 이름.
 *
 * 예전에는 「{이름}의 명품샵」으로 고정이었다. 자기 브랜드 이름을 걸고 싶은 사람이
 * 있어 전체를 직접 쓸 수 있게 하고, 안 쓰면 예전 형태를 그대로 만든다.
 */
export function shopTitle(ml: { displayName: string; shopTitle?: string | null }): string {
  const t = ml.shopTitle?.trim();
  return t && t.length > 0 ? t : `${ml.displayName}의 명품샵`;
}
