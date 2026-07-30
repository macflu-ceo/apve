// 브랜드 → 숫자 사이즈 기준(이탈리아 IT / 프랑스 FR) 판별
// 유럽 명품은 브랜드 본국 기준으로 숫자 사이즈를 매긴다.
//  - 이탈리아 하우스(구찌·프라다·D&G…) = IT  (여성 40 = S)
//  - 프랑스 하우스(샤넬·디올·셀린느…) = FR   (여성 40 = L)
// 확신 없는 브랜드는 null → "브랜드 본국 기준" 안내만 (틀린 정보 표기 방지).

export type SizeSystem = "IT" | "FR";

/** 매칭용 정규화: 소문자 + 영숫자·한글만 (공백/기호/& 제거) */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}

const IT_BRANDS = [
  "dolcegabbana", "dg", "gucci", "prada", "miumiu", "fendi", "bottegaveneta", "bottega",
  "valentino", "versace", "maxmara", "marni", "etro", "moschino", "ferragamo", "salvatoreferragamo",
  "brunellocucinelli", "loropiana", "tods", "zegna", "ermenegildozegna", "herno", "msgm",
  "missoni", "pucci", "emiliopucci", "robertocavalli", "armani", "giorgioarmani", "emporioarmani",
  "stoneisland", "diesel", "theandamane", "andamane", "attico", "theattico", "jilsander",
  "aspesi", "woolrich", "pinko", "twinset", "liujo", "blumarine", "albertaferretti",
  "palmangels", "offwhite", "gcds", "furla",
].map(norm);

const FR_BRANDS = [
  "chanel", "dior", "christiandior", "louisvuitton", "lv", "celine", "saintlaurent", "ysl",
  "yvessaintlaurent", "givenchy", "balmain", "chloe", "isabelmarant", "apc", "jacquemus",
  "sandro", "maje", "ami", "amiparis", "balenciaga", "lanvin", "longchamp", "thekooples",
  "zadigvoltaire", "zadigetvoltaire", "iro", "sezane", "rabanne", "pacorabanne", "mugler",
  "jeanpaulgaultier", "kenzo", "hermes", "courreges", "rochas",
].map(norm);

const IT_SET = new Set(IT_BRANDS);
const FR_SET = new Set(FR_BRANDS);

/** 브랜드명 → IT | FR | null (확신 없으면 null) */
export function sizeSystem(brand?: string | null): SizeSystem | null {
  if (!brand) return null;
  const n = norm(brand);
  if (!n) return null;
  if (IT_SET.has(n)) return "IT";
  if (FR_SET.has(n)) return "FR";
  return null;
}

/** 표시용 라벨 */
export function sizeSystemLabel(sys: SizeSystem | null): string {
  if (sys === "IT") return "이탈리아(IT)";
  if (sys === "FR") return "프랑스(FR)";
  return "브랜드 본국";
}
