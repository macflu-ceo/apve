// 리뷰 배너용 '글자 없는' 배경 (텍스트는 SVG로 또렷하게 얹음) — Gemini
//   실행: npx tsx scripts/gen_review_bg.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/banners";
const NO = "Absolutely NO text, no letters, no numbers, no words, no watermark.";
const BASE = "A friendly, cheerful SQUARE 1:1 illustration background for a promotional app banner. Warm cream, gold and coral palette, bright and inviting, clean modern 3D style, high quality. Keep the TOP THIRD calm and simple (a headline will be placed there); put the main objects in the lower two-thirds.";

const BGS = [
  { name: "review_bg_1", prompt: `${BASE} A smartphone showing a shopping app, five shiny gold review stars floating above it, and a few gold coins and a small gift box around it. ${NO}` },
  { name: "review_bg_2", prompt: `${BASE} A cheerful hand holding a smartphone with five gold stars and gold coins spilling out playfully, a gift box nearby. ${NO}` },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function genOnce(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY as string },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const img = (data?.candidates?.[0]?.content?.parts ?? []).find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
  if (!img) throw new Error("이미지 없음");
  return { b64: img.inlineData.data as string, mime: (img.inlineData.mimeType as string) || "image/png" };
}
async function gen(prompt: string) { let e: unknown; for (let i = 0; i < 8; i++) { try { return await genOnce(prompt); } catch (x) { e = x; await sleep(6000 * (i + 1)); } } throw e; }
async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const b of BGS) {
    try { const { b64, mime } = await gen(b.prompt); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${b.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", b.name);
    } catch (e) { console.error("✗", b.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
