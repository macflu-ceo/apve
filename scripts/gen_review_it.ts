// IT스럽고 화려한 리뷰 배너 배경 (숫자 20%만 박고 한글은 하단 컴포넌트 텍스트로)
//   실행: npx tsx scripts/gen_review_it.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/banners";
const ONLY20 = "The ONLY text allowed in the image is the number '20%'. Absolutely no letters, no words, no Korean text anywhere else.";
const BASE = "A vibrant, flashy, modern TECH-style SQUARE 1:1 promotional app banner background. Glossy 3D render, colorful gradient, glassmorphism, soft neon glow, sparkles and light streaks, energetic and playful yet premium, high quality, eye-catching. Leave the BOTTOM-LEFT area a bit calmer (a caption will go there).";

const BGS = [
  { name: "review_it_1", prompt: `${BASE} A glossy smartphone showing a shopping app UI, five shiny gold review stars bursting above it, floating gold coins and sparkles, and a big bold glossy 3D badge reading "20%". Vibrant coral, gold and magenta gradient. ${ONLY20}` },
  { name: "review_it_2", prompt: `${BASE} A dynamic tech scene: a floating glossy smartphone with a glowing app screen, five gold stars, confetti and sparkles, gold coins, and a bold shiny "20%" badge. Colorful energetic blue-purple-coral gradient. ${ONLY20}` },
  { name: "review_it_3", prompt: `${BASE} Warm premium-tech look (cream, gold, coral) but glossy and sparkly: a smartphone with glowing screen, five gold stars, gold coins, sparkles and light streaks, and a bold glossy "20%" badge. ${ONLY20}` },
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
