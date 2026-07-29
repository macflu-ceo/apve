// 메인 배너 이미지 생성 (Gemini 텍스트→이미지) — 플랫폼의 GEMINI_API_KEY 재사용
//   실행: npx tsx scripts/gen_banners.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/banners";

const NO_TEXT = "Absolutely no text, no letters, no numbers, no words, no watermark, no logo overlay in the image.";
const BASE = "A premium wide 16:9 banner image for a luxury e-commerce homepage. Photorealistic, high-end luxury brand campaign quality, warm elegant color grading.";

const BANNERS = [
  { name: "1_boutique_신뢰", prompt: `${BASE} An elegant Italian luxury boutique interior: warm marble floor, wood shelving displaying designer handbags, soft golden ambient lighting, cinematic editorial mood, cream and beige tones. Generous empty copy space on the right side for text. ${NO_TEXT}` },
  { name: "2_event_첫판매20", prompt: `${BASE} A sophisticated hand holding a smartphone showing a shopping/share screen, an elegant designer handbag placed beside it on a warm cream surface, soft natural light, minimal premium styling. Generous empty copy space on the left side for text. ${NO_TEXT}` },
  { name: "3_timesale_긴박", prompt: `${BASE} A dramatic luxury still life conveying a limited-time sale: a golden hourglass with sand flowing, next to a designer handbag, deep burgundy and gold color palette, dramatic directional lighting, sense of urgency and exclusivity. Empty copy space for text. ${NO_TEXT}` },
  { name: "4_onboarding", prompt: `${BASE} A clean bright modern studio scene for onboarding new sellers: a smartphone displaying a simple sharing interface, minimal luxury aesthetic, airy soft daylight, lots of negative space, uncluttered. Generous empty copy space for text. ${NO_TEXT}` },
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
  for (const b of BANNERS) {
    try {
      const { b64, mime } = await gen(b.prompt);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      const file = `${OUT}/${b.name}.${ext}`;
      writeFileSync(file, Buffer.from(b64, "base64"));
      console.log("✓ 생성:", file);
    } catch (e) {
      console.error("✗ 실패:", b.name, "—", e instanceof Error ? e.message : e);
    }
  }
}
main();
