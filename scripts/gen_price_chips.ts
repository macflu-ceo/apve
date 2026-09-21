// 홈 카테고리 칩 아이콘 10종 — 나노바나나(Gemini 이미지) 생성
//   실행: npx tsx scripts/gen_price_chips.ts
// 가격대 5종 + 취향 5종. 텍스트 없는 단일 오브젝트, 파스텔 단색 배경, 소프트 3D.
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/luxury-affiliate-platform/public/chips";

const BASE =
  "A vivid glossy 3D ICON in the style of modern 3D emoji icons (Apple/Fluent emoji look). ONE single subject, VERY LARGE, filling almost the entire frame, centered. Rich saturated colors, glossy highlights, soft studio lighting, subtle soft drop shadow under the object. Background: clean pure WHITE, nothing else. Premium luxury mood, punchy and eye-catching. Absolutely NO text, NO letters, NO numbers, NO logos, NO watermarks.";

const CHIPS: { file: string; subject: string }[] = [
  { file: "price20", subject: "a small elegant brown leather wallet with two shiny gold coins beside it" },
  { file: "price30", subject: "a neat small stack of shiny gold coins" },
  { file: "price50", subject: "a glossy luxury shopping bag with a silk ribbon bow" },
  { file: "priceUnder100", subject: "a golden gift box with an elegant bow, slightly open with soft glow" },
  { file: "premium", subject: "a brilliant sparkling diamond gemstone" },
  { file: "popular", subject: "a shiny golden trophy cup with a tiny flame above it" },
  { file: "recommend", subject: "a big glossy golden five-point star with small sparkles" },
  { file: "new", subject: "a hanging luxury price tag with bright sparkle stars around it (tag is blank, no text)" },
  { file: "sale", subject: "a glossy red discount percent-sign symbol (%) as a 3D object" },
  { file: "bag", subject: "a plain black quilted luxury handbag with a small gold clasp, no logo" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function genOnce(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY as string },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error?.message || `HTTP ${res.status}`);
  const img = (d?.candidates?.[0]?.content?.parts ?? []).find(
    (x: { inlineData?: { data?: string } }) => x?.inlineData?.data
  );
  if (!img) throw new Error("이미지 없음");
  return Buffer.from(img.inlineData.data as string, "base64");
}

async function gen(prompt: string) {
  let e: unknown;
  for (let i = 0; i < 6; i++) {
    try { return await genOnce(prompt); } catch (x) { e = x; await sleep(5000 * (i + 1)); }
  }
  throw e;
}

async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const c of CHIPS) {
    try {
      const buf = await gen(`${BASE} Subject: ${c.subject}`);
      writeFileSync(`${OUT}/${c.file}.png`, buf);
      console.log("✓", c.file);
    } catch (e) {
      console.error("✗", c.file, e instanceof Error ? e.message : e);
    }
    await sleep(2000);
  }
}
main();
