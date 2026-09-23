// 이미지 없음으로 비활성된 상품의 원본 HTML에 실제 이미지가 있는지 진단
import "./loadenv";
import { prisma } from "../src/lib/db";
import { keepProductImages } from "../src/lib/godomall/scrape";

const URL_RE = /https?:\/\/[^"'\s\\)]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^"'\s\\)]*)?/gi;

async function main() {
  const rows = await prisma.product.findMany({
    where: { active: false, OR: [{ imagesJson: null }, { imagesJson: "[]" }] },
    select: { goodsNo: true, name: true },
    take: 6,
  });
  console.log("검사 대상:", rows.length, "건\n");

  for (const p of rows) {
    const url = `https://viaelite.co.kr/goods/goods_view.php?goodsNo=${p.goodsNo}`;
    const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text()).catch(() => "");
    if (!html) { console.log(p.goodsNo, "→ HTML 가져오기 실패\n"); continue; }

    const all = [...new Set([...html.matchAll(URL_RE)].map((m) => m[0]))];
    const bucket = all.filter((u) => /jprimo-partners-system-bucket/i.test(u));
    const kept = keepProductImages(all);
    const droppedByPercent = all.filter((u) => u.includes("%"));
    const og = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i)?.[1] ?? null;

    console.log(`[${p.goodsNo}] ${p.name.slice(0, 40)}`);
    console.log("  HTML 내 전체 이미지 URL:", all.length, "| 현재 로직이 잡는 버킷 URL:", bucket.length);
    console.log("  og:image:", og ? og.slice(0, 90) : "없음");
    console.log("  %(인코딩) 때문에 버려지는 수:", droppedByPercent.length);
    console.log("  필터 통과:", kept.length);
    // 현재 로직이 놓치는 후보 (버킷 아님 + 템플릿/SNS 아님)
    const missed = kept.filter((u) => !/jprimo-partners-system-bucket/i.test(u) && u !== og);
    for (const u of missed.slice(0, 5)) console.log("   · 놓친 후보:", u.slice(0, 110));
    console.log();
  }
}
main().finally(() => prisma.$disconnect());
