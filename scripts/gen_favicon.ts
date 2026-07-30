// 파비콘용 초심플 아이콘 — 3번(블랙백+골드코인) 기반, 아주 단순하게
//   실행: npx tsx scripts/gen_favicon.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/app_icon";

const NO_TEXT = "No text, no letters, no numbers, no words, no watermark, no brand logo.";
const BASE = "A clean minimal app icon / favicon, perfectly square 1:1, EXTREMELY SIMPLE and BOLD so it stays recognizable even at very small sizes (16 pixels). One single centered subject, large with generous padding, very high contrast, only a few big clean shapes, smooth soft-3D look. Soft beige background.";

const ICONS = [
  { name: "fav_1_bag_coins", prompt: `${BASE} A black luxury handbag with just 3 or 4 large shiny gold coins spilling from the open top. Bold rounded shapes, minimal. ${NO_TEXT}` },
  { name: "fav_2_bag_coins_flat", prompt: `${BASE} A black luxury handbag with two or three big gold coins above its open top. Flat minimal icon style, thick clean outlines, strong contrast. ${NO_TEXT}` },
  { name: "fav_3_bag_one_coin", prompt: `${BASE} A black luxury handbag with a single large gold coin popping out of the top. Ultra minimal, iconic, centered. ${NO_TEXT}` },
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
  for (const c of ICONS) {
    try {
      const { b64, mime } = await gen(c.prompt);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${c.name}.${ext}`, Buffer.from(b64, "base64"));
      console.log("✓ 생성:", c.name);
    } catch (e) { console.error("✗ 실패:", c.name, "—", e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
