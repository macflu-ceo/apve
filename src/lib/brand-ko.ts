// 브랜드 한글 표기 — 고도몰 브랜드명(makerNm)은 전부 영문이라
// "구찌"로 찾는 사람이 아무것도 못 찾는다. 표기와 검색 양쪽에 쓴다.

/** 비교용 정규화 — 소문자, 공백·기호 제거, 라틴 악센트 해체 */
export function bnorm(s: string): string {
  // NFD 는 한글 음절도 자모로 쪼갠다. 악센트만 떼고 바로 NFC 로 되돌려야
  // "구찌" 가 통째로 사라지지 않는다.
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
}

/** 정규화된 영문 브랜드키 → 한글 표기(첫 번째가 대표) */
const KO: Record<string, string[]> = {
  gucci: ["구찌"],
  prada: ["프라다"],
  miumiu: ["미우미우"],
  celine: ["셀린느", "셀린"],
  dior: ["디올", "크리스챤디올", "크리스찬디올"],
  christiandior: ["크리스챤디올", "디올"],
  diorhomme: ["디올옴므", "디올"],
  bottegaveneta: ["보테가베네타", "보테가"],
  saintlaurent: ["생로랑", "입생로랑", "생로랑파리"],
  balenciaga: ["발렌시아가"],
  fendi: ["펜디"],
  valentino: ["발렌티노"],
  valentinogaravani: ["발렌티노가라바니", "발렌티노"],
  valentinopap: ["발렌티노"],
  givenchy: ["지방시"],
  burberry: ["버버리"],
  loropiana: ["로로피아나"],
  versace: ["베르사체"],
  ferragamo: ["페라가모"],
  salvatoreferragamo: ["살바토레페라가모", "페라가모"],
  moncler: ["몽클레어", "몽클레르"],
  monclergrenoble: ["몽클레어그레노블", "몽클레어"],
  tomford: ["톰포드"],
  alexandermcqueen: ["알렉산더맥퀸", "맥퀸"],
  maxmara: ["막스마라"],
  smaxmara: ["에스막스마라", "막스마라"],
  maxmarastudio: ["막스마라스튜디오", "막스마라"],
  maxmaraweekend: ["막스마라위켄드", "막스마라"],
  weekend: ["위켄드막스마라", "막스마라"],
  chloe: ["끌로에", "클로에"],
  dolcegabbana: ["돌체앤가바나", "돌체가바나", "돌체"],
  zegna: ["제냐"],
  ermenegildozegna: ["에르메네질도제냐", "제냐"],
  jacquemus: ["자크뮈스"],
  maisonmargiela: ["메종마르지엘라", "마르지엘라"],
  mm6maisonmargiela: ["엠엠식스", "메종마르지엘라", "마르지엘라"],
  therow: ["더로우"],
  toteme: ["토테메", "토템"],
  khaite: ["카이트"],
  thombrowne: ["톰브라운"],
  offwhite: ["오프화이트"],
  ami: ["아미"],
  acnestudios: ["아크네스튜디오", "아크네"],
  goldengoose: ["골든구스"],
  goldengoosedeluxebrand: ["골든구스"],
  christianlouboutin: ["크리스찬루부탱", "루부탱"],
  jimmychoo: ["지미추"],
  aminamuaddi: ["아미나무아디"],
  tods: ["토즈"],
  mulberry: ["멀버리"],
  mcm: ["엠씨엠"],
  coach: ["코치"],
  toryburch: ["토리버치"],
  longchamp: ["롱샴"],
  marni: ["마르니"],
  isabelmarant: ["이자벨마랑"],
  stoneisland: ["스톤아일랜드"],
  loewe: ["로에베"],
  apc: ["아페쎄"],
  anndemeulemeester: ["앤드뮐미스터"],
  adidas: ["아디다스"],
  alaia: ["알라이아"],
  amiri: ["아미리"],
  birkenstock: ["버켄스탁", "비르켄슈톡"],
  blazemilano: ["블레이즈밀라노"],
  brunellocucinelli: ["브루넬로쿠치넬리", "쿠치넬리"],
  cpcompany: ["씨피컴퍼니"],
  courreges: ["꾸레쥬"],
  drumohr: ["드루모어"],
  dsquared2: ["디스퀘어드"],
  elisabettafranchi: ["엘리자베타프란키"],
  emporioarmani: ["엠포리오아르마니", "아르마니"],
  giorgioarmani: ["조르지오아르마니", "아르마니"],
  etro: ["에트로"],
  extremecashmere: ["익스트림캐시미어"],
  fabianafilippi: ["파비아나필리피"],
  herno: ["헤르노"],
  hogan: ["호간"],
  hugoboss: ["휴고보스", "보스"],
  jacobcohen: ["야곱코헨"],
  justcavalli: ["저스트카발리", "카발리"],
  kitonciropaone: ["키톤"],
  kiton: ["키톤"],
  kurtgeiger: ["커트가이거"],
  maisonkitsune: ["메종키츠네"],
  marcjacobs: ["마크제이콥스"],
  michaelbymichaelkors: ["마이클코어스"],
  michaelkors: ["마이클코어스"],
  moonbootxguestinresidence: ["문부츠"],
  moorer: ["무레르"],
  palmangels: ["팜엔젤스"],
  pinko: ["핑코"],
  poloralphlauren: ["폴로랄프로렌", "랄프로렌"],
  rotate: ["로테이트"],
  sacai: ["사카이"],
  santoni: ["산토니"],
  semicouture: ["세미꾸뛰르"],
  theandamane: ["안다만"],
  thejackandjackieleathers: ["잭앤재키"],
  umawang: ["우마왕"],
  viviennewestwood: ["비비안웨스트우드"],
  y3: ["와이쓰리"],
  zanone: ["자노네"],
};

/** 브랜드명의 한글 대표 표기 — 모르면 null */
export function brandKo(name: string): string | null {
  return KO[bnorm(name)]?.[0] ?? null;
}

/** 목록에 띄울 이름 — 한글을 알면 한글로 (모르는 브랜드는 원문 그대로) */
export function brandLabel(name: string): string {
  return brandKo(name) ?? name;
}

/**
 * 검색어 하나로 한글·영문 어느 쪽을 쳐도 걸리게 한다.
 * "구찌"·"gucci"·"GUCCI" 전부 Gucci 를 찾는다.
 */
export function brandMatches(name: string, query: string): boolean {
  const q = bnorm(query);
  if (q === "") return true;
  const key = bnorm(name);
  if (key.includes(q)) return true;
  for (const ko of KO[key] ?? []) {
    if (bnorm(ko).includes(q)) return true;
  }
  return false;
}
