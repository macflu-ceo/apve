// 홈 자동 갱신 — 매일 1회: ① 재고·가격 최신화(+품절 비활성) ② 신규 차액 상품 등록 ③ 섹션 재편성
// 카탈로그 API(빠름)로 시세·재고를 받아 우리 Product 와 대사(對査)한다. 무거운 작업이라 서버리스 크론엔 부적합 → 로컬/GitHub Actions 권장.
import { prisma } from "@/lib/db";
import { fetchCatalog } from "@/lib/godomall/catalog";
import { importGoodsNos } from "@/lib/godomall/import";
import { conciergePrice } from "@/lib/pricing";

const BRANDS: { name: string; tier: number }[] = [
  ...["Gucci","Prada","Celine","Dior","Bottega Veneta","Saint Laurent","Balenciaga","Fendi","Valentino","Givenchy","Burberry","Miu Miu","Loro Piana","Versace","Ferragamo","Moncler","Tom Ford","Alexander McQueen","Max Mara","Chloe","Dolce & Gabbana","Zegna"].map((name) => ({ name, tier: 0 })),
  ...["Jacquemus","Maison Margiela","The Row","Toteme","Khaite","Thom Browne","Off-White","Ami","Acne Studios","Golden Goose","Christian Louboutin","Jimmy Choo","Amina Muaddi","Tod's","Mulberry","MCM","Coach","Tory Burch","Longchamp","Marni","Isabel Marant","Stone Island"].map((name) => ({ name, tier: 1 })),
];

// 홈 섹션 타이틀 → 카테고리 키워드 (상품명 매칭)
const SECTION_KW: { title: string; kw: string[] }[] = [
  { title: "데일리를 완성하는 가방", kw: ["bag","tote","hobo","shoulder","crossbody","clutch","backpack","pouch","minibag","백","가방","토트","숄더","클러치","백팩"] },
  { title: "발끝부터 다르게, 슈즈", kw: ["shoe","boot","loafer","pump","heel","sneaker","sandal","mule","ballerina","derby","슈즈","부츠","로퍼","스니커","힐","샌들","펌프스"] },
  { title: "간절기, 첫 아우터", kw: ["coat","jacket","blazer","trench","parka","down","outer","bomber","코트","자켓","아우터","트렌치","패딩","블레이저","점퍼"] },
  { title: "매일 입기 좋은 상의", kw: ["shirt","tee","t-shirt","top","blouse","polo","sweatshirt","hoodie","셔츠","티셔츠","탑","블라우스","폴로","맨투맨","후드"] },
  { title: "포인트 아이템", kw: ["belt","scarf","wallet","cap","hat","sunglass","jewel","necklace","earring","bracelet","ring","card","keyring","glove","tie","벨트","스카프","지갑","모자","선글라스","목걸이","귀걸이","반지","카드","장갑"] },
  { title: "26FW, 지금 입는 니트", kw: ["knit","sweater","cardigan","pullover","turtleneck","니트","스웨터","가디건","풀오버"] },
  { title: "한 벌로 완성", kw: ["dress","skirt","jumpsuit","gown","set","드레스","원피스","스커트","점프수트","세트업"] },
  { title: "바지부터 다르게", kw: ["pants","trouser","jeans","denim","shorts","chino","legging","팬츠","바지","진","데님","슬랙스","쇼츠","치노"] },
];

const PAGES = 4;
const MIN_DISC_RATE = 10;
const PER_SECTION = 100;
const MAX_PER_BRAND = 12;
const NEW_LIMIT_DEFAULT = 100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const bkey = (s: string) => (s || "").toLowerCase().replace(/[^a-z가-힣]/g, "");
// 동일 상품 식별 키 — 브랜드+상품명 정규화(색상/재등록 변형이 다른 goodsNo여도 같은 상품으로 묶음)
const nameKey = (brand: string | null, name: string | null) =>
  bkey(brand ?? "") + "|" + (name ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/** 대표 이미지 URL 정규화 (쿼리 제거·소문자) — 없으면 null */
function firstImageUrl(imagesJson: string | null): string | null {
  try {
    const arr = JSON.parse(imagesJson || "[]");
    const u = Array.isArray(arr) && arr.length ? String(arr[0]) : "";
    if (!u) return null;
    return u.split("?")[0].trim().toLowerCase();
  } catch { return null; }
}
/**
 * 동일 상품 정리 — 같은 (브랜드+대표이미지) 그룹에서 재고 있고 차액 큰 하나만 남기고 나머지 active=false.
 * 매일 재고갱신 직후 호출(품절 아닌 중복이 되살아나도 매번 재정리).
 */
export async function dedupeActiveProducts(commit: boolean): Promise<{ groups: number; hidden: number }> {
  const rows = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, brand: true, name: true, imagesJson: true, stock: true, listPrice: true, salePrice: true },
  });
  // 품질 좋은 순으로 정렬 후, 대표이미지 또는 브랜드+상품명 중 하나라도 이미 등장했으면 중복으로 판단해 숨김
  rows.sort((a, b) => {
    const sa = (a.stock ?? 0) > 0 ? 1 : 0, sb = (b.stock ?? 0) > 0 ? 1 : 0;
    if (sa !== sb) return sb - sa; // 재고 있는 것 우선
    const da = (a.listPrice ?? 0) - (a.salePrice ?? 0), db = (b.listPrice ?? 0) - (b.salePrice ?? 0);
    if (da !== db) return db - da; // 차액 큰 것 우선
    const pa = a.salePrice ?? Number.MAX_SAFE_INTEGER, pb = b.salePrice ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb; // 판매가 낮은 것 우선
    return a.id < b.id ? -1 : 1;
  });
  const seenImg = new Set<string>();
  const seenName = new Set<string>();
  const losers: string[] = [];
  const dupKeys = new Set<string>();
  for (const r of rows) {
    const img = firstImageUrl(r.imagesJson);
    const imgK = img; // 대표이미지 URL 단독(브랜드 표기가 달라도 동일 이미지면 같은 상품) — 가장 정확
    const nameK = nameKey(r.brand, r.name);
    const dupByImg = imgK != null && seenImg.has(imgK);
    const dupByName = seenName.has(nameK);
    if (dupByImg || dupByName) {
      losers.push(r.id);
      dupKeys.add(dupByImg && imgK ? imgK : nameK);
    } else {
      if (imgK) seenImg.add(imgK);
      seenName.add(nameK);
    }
  }
  if (commit && losers.length) {
    const CH = 200;
    for (let i = 0; i < losers.length; i += CH) {
      await prisma.product.updateMany({ where: { id: { in: losers.slice(i, i + CH) } }, data: { active: false } }).catch(() => {});
    }
  }
  return { groups: dupKeys.size, hidden: losers.length };
}
function detectTitle(nm: string): string | null {
  const s = (nm || "").toLowerCase();
  for (const c of SECTION_KW) if (c.kw.some((k) => s.includes(k))) return c.title;
  return null;
}

interface PoolItem { goodsNo: string; goodsNm: string; sellPrice: number; listPrice: number; stock: number; soldOut: boolean; discAmt: number; tier: number }

export interface HomeRefreshResult {
  poolSize: number;
  stockUpdated: number;
  deactivated: number;
  reactivated: number;
  newImported: number;
  newErrors: number;
  dupHidden: number;
  sections: { title: string; n: number }[];
  committed: boolean;
  ms: number;
}

/** 유명브랜드 카탈로그 수집 → goodsNo별 시세/재고 맵 */
async function collectPool(log?: (s: string) => void): Promise<Map<string, PoolItem>> {
  const map = new Map<string, PoolItem>();
  for (const b of BRANDS) {
    for (let page = 1; page <= PAGES; page++) {
      try {
        const r = await fetchCatalog({ brand: b.name, sort: "sales", limit: 200, page }); // inStock 필터 없이 전체(품절도 받아 비활성 판단)
        for (const it of r.list) {
          const sell = it.sellPrice ?? 0, list = it.listPrice ?? 0;
          const g = String(it.goodsNo);
          const discAmt = list > 0 && sell > 0 ? list - sell : 0;
          const prev = map.get(g);
          if (!prev || b.tier < prev.tier) {
            map.set(g, { goodsNo: g, goodsNm: it.goodsNm ?? "", sellPrice: sell, listPrice: list, stock: it.stock ?? 0, soldOut: !!it.soldOut, discAmt, tier: b.tier });
          }
        }
        if (r.list.length < 200) break;
      } catch { /* 브랜드/페이지 오류 무시 */ }
      await sleep(100);
    }
    log?.(`  ${b.name}`);
  }
  return map;
}

export async function runHomeRefresh(opts: { commit: boolean; injectNew: boolean; newLimit?: number; log?: (s: string) => void } ): Promise<HomeRefreshResult> {
  const t0 = Date.now();
  const log = opts.log ?? (() => {});
  const newLimit = opts.newLimit ?? NEW_LIMIT_DEFAULT;

  log("① 카탈로그 수집…");
  const pool = await collectPool();
  log(`   풀 ${pool.size}개`);

  // ② 재고·가격 최신화 (+품절 비활성 / 재입고 활성)
  log("② 재고·가격 최신화…");
  const products = await prisma.product.findMany({ select: { id: true, goodsNo: true, active: true, salePrice: true, listPrice: true, stock: true } });
  const updates: { id: string; data: Record<string, unknown>; wasActive: boolean; willActive: boolean }[] = [];
  for (const p of products) {
    const it = pool.get(p.goodsNo);
    if (!it) continue; // 카탈로그에 없으면 손대지 않음(상위페이지 밖일 수 있음)
    const willActive = !(it.soldOut || it.stock <= 0);
    const newSale = it.sellPrice > 0 ? conciergePrice(it.sellPrice) : p.salePrice;
    const newList = it.listPrice > 0 ? it.listPrice : p.listPrice;
    const changed = p.active !== willActive || p.stock !== it.stock || p.salePrice !== newSale || p.listPrice !== newList;
    if (changed) updates.push({ id: p.id, data: { active: willActive, stock: it.stock, salePrice: newSale, listPrice: newList }, wasActive: p.active, willActive });
  }
  let stockUpdated = 0, deactivated = 0, reactivated = 0;
  if (opts.commit) {
    const CH = 25;
    for (let i = 0; i < updates.length; i += CH) {
      await Promise.all(updates.slice(i, i + CH).map((u) => prisma.product.update({ where: { id: u.id }, data: u.data }).then(() => {}).catch(() => {})));
    }
  }
  for (const u of updates) {
    stockUpdated++;
    if (u.wasActive && !u.willActive) deactivated++;
    if (!u.wasActive && u.willActive) reactivated++;
  }
  log(`   변경 ${stockUpdated} (품절제외 ${deactivated} · 재입고 ${reactivated})`);

  // ③ 신규 차액 상품 등록
  let newImported = 0, newErrors = 0;
  if (opts.injectNew) {
    log("③ 신규 차액 상품 등록…");
    const existing = new Set(products.map((p) => p.goodsNo));
    const cands = [...pool.values()]
      .filter((it) => !existing.has(it.goodsNo) && !it.soldOut && it.stock > 0 && it.sellPrice > 0 && it.listPrice > 0 && it.discAmt > 0 && Math.round((1 - it.sellPrice / it.listPrice) * 100) >= MIN_DISC_RATE)
      .sort((a, b) => b.discAmt - a.discAmt)
      .slice(0, newLimit)
      .map((it) => it.goodsNo);
    if (opts.commit && cands.length) {
      const r = await importGoodsNos(cands);
      newImported = r.created; newErrors = r.errors.length;
    } else {
      newImported = cands.length; // 미리보기: 등록 예정 수
    }
    log(`   신규 ${newImported}${opts.commit ? "" : "(예정)"}${newErrors ? ` · 실패 ${newErrors}` : ""}`);
  }

  // ③.5 동일 상품 정리 (브랜드+대표이미지 기준, 재고갱신 직후라 되살아난 중복도 재정리)
  log("③.5 동일 상품 정리…");
  const dedup = await dedupeActiveProducts(opts.commit);
  log(`   중복 ${dedup.groups}그룹 · ${dedup.hidden}개 비활성`);

  // ④ 섹션 재편성 (품절 제외, 차액순, 브랜드 다양성)
  log("④ 섹션 재편성…");
  const active = await prisma.product.findMany({ where: { active: true }, select: { id: true, name: true, brand: true, listPrice: true, salePrice: true } });
  const buckets = new Map<string, { id: string; brand: string; nameKey: string; disc: number }[]>();
  for (const s of SECTION_KW) buckets.set(s.title, []);
  for (const p of active) {
    const t = detectTitle(p.name);
    if (!t) continue;
    const lp = p.listPrice ?? 0, sp = p.salePrice ?? 0;
    buckets.get(t)!.push({ id: p.id, brand: p.brand ?? "", nameKey: nameKey(p.brand, p.name), disc: lp > 0 && sp > 0 ? lp - sp : 0 });
  }
  const seenName = new Set<string>(); // 동일 상품(이름) 중복 노출 방지 — 전 섹션 통틀어 1회
  const sections: { title: string; n: number }[] = [];
  for (const s of SECTION_KW) {
    const arr = buckets.get(s.title)!.sort((a, b) => b.disc - a.disc);
    const per = new Map<string, number>();
    const ids: string[] = [];
    for (const p of arr) {
      if (seenName.has(p.nameKey)) continue; // 중복 상품 스킵
      const k = bkey(p.brand);
      if ((per.get(k) || 0) >= MAX_PER_BRAND) continue;
      ids.push(p.id); per.set(k, (per.get(k) || 0) + 1); seenName.add(p.nameKey);
      if (ids.length >= PER_SECTION) break;
    }
    if (opts.commit) {
      const sec = await prisma.section.findFirst({ where: { title: s.title } });
      if (sec) {
        // 한 섹션 실패해도 전체 잡이 죽지 않도록 방어 (동시 실행 레이스 등)
        try {
          await prisma.$transaction([
            prisma.sectionProduct.deleteMany({ where: { sectionId: sec.id } }),
            ...ids.map((productId, i) => prisma.sectionProduct.create({ data: { sectionId: sec.id, productId, sort: i } })),
          ]);
        } catch (e) {
          log(`   ⚠️ 섹션 교체 실패(${s.title}): ${e instanceof Error ? e.message : e}`);
        }
      }
    }
    sections.push({ title: s.title, n: ids.length });
  }
  log("   완료");

  return { poolSize: pool.size, stockUpdated, deactivated, reactivated, newImported, newErrors, dupHidden: dedup.hidden, sections, committed: opts.commit, ms: Date.now() - t0 };
}

/** 결과 → 텔레그램 알림 텍스트 */
export function homeRefreshText(r: HomeRefreshResult): string {
  const min = (r.ms / 60000).toFixed(1);
  const secLine = r.sections.map((s) => s.n).join("/");
  return [
    `🔄 <b>홈 자동 갱신 완료</b> (${min}분)`,
    `· 재고·가격 최신화 ${r.stockUpdated}건 (품절제외 ${r.deactivated} · 재입고 ${r.reactivated})`,
    `· 신규 등록 ${r.newImported}${r.newErrors ? ` (실패 ${r.newErrors})` : ""}`,
    `· 동일상품 정리 ${r.dupHidden}개 비활성`,
    `· 섹션 재편성: ${secLine} (총 ${r.sections.reduce((a, s) => a + s.n, 0)}개)`,
  ].join("\n");
}
