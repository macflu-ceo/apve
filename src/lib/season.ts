// 상품명에서 시즌(SS/FW + 연도)을 추출한다.
// 예) "[Gucci] SS26 …" → "26SS",  "[MULBERRY] FW26 …" → "26FW",  "25FW" → "25FW"
// 표기는 <연도2자리><시즌>(예: 26SS)으로 정규화해 정렬이 자연스럽게 되도록 한다.

const SEASON_MAP: Record<string, "SS" | "FW"> = {
  SS: "SS",
  "S/S": "SS",
  SP: "SS",
  FW: "FW",
  "F/W": "FW",
  AW: "FW",
  "A/W": "FW",
};

/** 상품명 등에서 시즌 코드 추출 → "26SS" / "25FW" / null */
export function parseSeason(text: string | null | undefined): string | null {
  if (!text) return null;
  const s = text.toUpperCase();

  // 시즌 먼저: SS26 / FW26 / AW26 / S/S 26
  let m = s.match(/\b(SS|FW|AW|SP|S\/S|F\/W|A\/W)\s?['`]?(\d{2})\b/);
  if (m) {
    const season = SEASON_MAP[m[1]];
    if (season) return `${m[2]}${season}`;
  }
  // 연도 먼저: 26SS / 25FW
  m = s.match(/\b(\d{2})\s?(SS|FW|AW|SP|S\/S|F\/W|A\/W)\b/);
  if (m) {
    const season = SEASON_MAP[m[2]];
    if (season) return `${m[1]}${season}`;
  }
  return null;
}

/** 정렬용 숫자키 (최신 시즌이 큼). 없으면 -1 */
export function seasonRank(code: string | null | undefined): number {
  if (!code) return -1;
  const m = code.match(/^(\d{2})(SS|FW)$/);
  if (!m) return -1;
  return parseInt(m[1], 10) * 10 + (m[2] === "FW" ? 1 : 0);
}
