// 기획전 상단 배너 이미지 생성 (와이드 3:1) — Gemini
//   실행: npx tsx scripts/gen_exhibition_banners.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/exhibitions";

const NO = "No text, no letters, no numbers, no words, no watermark, no brand logo.";
const BASE = "A wide horizontal hero banner image, panoramic about 3:1 aspect ratio, for a luxury shopping app exhibition page. Friendly, bright and inviting, vibrant yet tasteful, photorealistic and eye-catching. Keep the lower-left area relatively simple and uncluttered (a title will be overlaid there).";

const BANNERS = [
  { name: "discount", prompt: `${BASE} A cheerful luxury sale scene: elegant designer handbags and shoes arranged with a bright, celebratory big-discount mood, warm coral, red and gold tones, festive and energetic, conveying great savings on luxury. ${NO}` },
  { name: "gucci", prompt: `${BASE} An elegant display of brand-new luxury handbags and accessories freshly arranged in a warm boutique, rich green and deep red editorial tones with soft golden light, premium new-arrival mood. ${NO}` },
  { name: "prada", prompt: `${BASE} A sleek modern display of new-season luxury handbags and accessories in a clean minimal boutique, cool elegant tones with soft daylight, fresh premium new-arrival mood. ${NO}` },
  { name: "premium", prompt: `${BASE} An opulent high-end luxury display: the most premium designer handbags on marble with gold accents, deep rich tones and warm golden light, sophisticated exclusive top-tier boutique mood. ${NO}` },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function genOnce(prompt: string) {
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

async function gen(prompt: string) {
  let lastErr: unknown;
  for (let i = 0; i < 8; i++) {
    try { return await genOnce(prompt); }
    catch (e) { lastErr = e; await sleep(6000 * (i + 1)); }
  }
  throw lastErr;
}

async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const b of BANNERS) {
    try {
      const { b64, mime } = await gen(b.prompt);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${b.name}.${ext}`, Buffer.from(b64, "base64"));
      console.log("✓ 생성:", b.name);
    } catch (e) { console.error("✗ 실패:", b.name, "—", e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
