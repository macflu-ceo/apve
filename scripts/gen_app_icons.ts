// 돈버는 명품샵 앱 아이콘 컨셉 생성 (Gemini 텍스트→이미지)
//   실행: npx tsx scripts/gen_app_icons.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/app_icon";

const NO_TEXT = "No text, no letters, no numbers, no words, no watermark.";
const BASE = "A modern mobile app icon, perfectly square 1:1, flat minimal vector illustration style, a single bold centered symbol with slight padding, clean solid or smooth-gradient background, high contrast, crisp and simple so it reads clearly at small sizes. Rounded-square app icon composition.";

const ICONS = [
  { name: "1_gold_handbag", prompt: `${BASE} A centered elegant luxury handbag symbol in shiny gold, on a deep warm brown to burgundy gradient background. Premium, iconic, simple clean silhouette. ${NO_TEXT}` },
  { name: "2_bag_coin", prompt: `${BASE} A luxury handbag together with a single gold coin, symbolizing earning money from luxury shopping. Warm cream and gold palette, friendly yet premium, simple bold shapes. ${NO_TEXT}` },
  { name: "3_shopping_bag", prompt: `${BASE} A minimalist luxury shopping bag icon in gold with a small subtle sparkle, on a rich warm brown background. Clean, modern, boutique feel. ${NO_TEXT}` },
  { name: "4_crest", prompt: `${BASE} An elegant minimalist luxury emblem/crest in gold, refined and symmetrical, on a deep warm brown background. Premium boutique monogram feel. ${NO_TEXT}` },
  { name: "5_coin_stack_bag", prompt: `${BASE} A small stack of gold coins next to a luxury handbag, warm cream and gold tones, cheerful premium mood, bold simple shapes conveying 'earning from luxury'. ${NO_TEXT}` },
];

async function gen(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY as string },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
  if (!img) throw new Error("이미지 없음: " + JSON.stringify(data).slice(0, 200));
  return { b64: img.inlineData.data as string, mime: (img.inlineData.mimeType as string) || "image/png" };
}

async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const c of ICONS) {
    try {
      const { b64, mime } = await gen(c.prompt);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      const file = `${OUT}/${c.name}.${ext}`;
      writeFileSync(file, Buffer.from(b64, "base64"));
      console.log("✓ 생성:", file);
    } catch (e) {
      console.error("✗ 실패:", c.name, "—", e instanceof Error ? e.message : e);
    }
  }
}
main();
