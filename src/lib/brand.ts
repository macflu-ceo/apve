// 브랜드 표기 정규화 — 대소문자·악센트·별칭이 달라도 같은 브랜드는 한 표기로.
// 신규 수집(import) 시 기존 DB 표기에 맞춰 저장해, 필터 드롭다운이 다시 갈라지지 않게 한다.
import { prisma } from "@/lib/db";

/** 악센트 제거 + 대문자 + 기호 정리 → 비교용 키 (Chloé/CHLOE' → CHLOE) */
export function brandKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9&]+/g, " ")
    .trim();
}

// 표기가 아예 다른 동일 브랜드 별칭 (키 기준)
const ALIAS: Record<string, string> = {
  "CHRISTIAN DIOR": "DIOR",
  "DIOR HOMME": "DIOR",
  "AMI": "AMI PARIS",
  "SALVATORE FERRAGAMO": "FERRAGAMO",
  "VALENTINO GARAVANI": "VALENTINO",
};

export function brandGroupKey(s: string): string {
  const k = brandKey(s);
  return ALIAS[k] ?? k;
}

// 기존 브랜드 표기 캐시 (그룹키 → 대표 표기). 수집 배치 동안 반복 조회를 아낀다.
let cache: { at: number; map: Map<string, string> } | null = null;
const TTL = 5 * 60 * 1000;

/** 입력 브랜드를 DB에 이미 있는 대표 표기로 맞춘다. 처음 보는 브랜드면 입력 그대로. */
export async function canonicalizeBrand(brand: string | null): Promise<string | null> {
  if (!brand) return brand;
  const input = brand.trim();
  if (!input) return null;

  if (!cache || Date.now() - cache.at > TTL) {
    const rows = await prisma.product.groupBy({ by: ["brand"], _count: true, where: { brand: { not: null } } });
    const best = new Map<string, { rep: string; n: number }>();
    for (const r of rows) {
      if (!r.brand) continue;
      const k = brandGroupKey(r.brand);
      const cur = best.get(k);
      if (!cur || r._count > cur.n) best.set(k, { rep: r.brand, n: r._count });
    }
    cache = { at: Date.now(), map: new Map([...best].map(([k, v]) => [k, v.rep])) };
  }
  return cache.map.get(brandGroupKey(input)) ?? input;
}
