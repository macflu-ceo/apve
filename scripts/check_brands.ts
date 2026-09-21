// 병합 후 검증 — 정규화 키 기준 남은 중복 그룹이 있는지 확인
import "./loadenv";
import { prisma } from "../src/lib/db";

async function main() {
  const rows = await prisma.product.groupBy({ by: ["brand"], _count: true, where: { brand: { not: null }, active: true } });
  const byKey = new Map<string, string[]>();
  for (const r of rows) {
    const k = (r.brand || "").normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/[^A-Z0-9&]+/g, " ").trim();
    byKey.set(k, (byKey.get(k) ?? []).concat(r.brand!));
  }
  const dup = [...byKey.entries()].filter(([, v]) => v.length > 1);
  console.log("남은 중복 그룹:", dup.length, JSON.stringify(dup.slice(0, 10)));
  console.log("활성 브랜드 수:", rows.length);
}
main().finally(() => prisma.$disconnect());
