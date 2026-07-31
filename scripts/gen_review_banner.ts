// 앱 다운로드+리뷰 유도 메인 배너 (텍스트 포함) — Gemini(nano-banana)
//   실행: npx tsx scripts/gen_review_banner.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/banners";

const BASE = "A friendly, eye-catching SQUARE 1:1 promotional app banner for a luxury shopping service. Warm cream, gold and coral palette, bright cheerful mood, clean modern 3D illustration, high quality. The Korean text must be rendered CLEARLY and CORRECTLY SPELLED in a bold rounded Korean sans-serif, well spaced, high contrast, no misspellings, no gibberish characters.";

const BANNERS = [
  { name: "review_app_1", prompt: `${BASE} Compose the Korean headline text "앱 설치하고 리뷰 쓰면" at the top, and a big bold "수수료 20%" just below it. In the lower area show a smartphone displaying a shopping app with five shiny gold review stars and a couple of gold coins. Keep text in the upper half, imagery in the lower half.` },
  { name: "review_app_2", prompt: `${BASE} Put the large Korean text "리뷰 쓰고 20% 받기" as the main focus in the upper-center, decorated with five gold stars above it. Below, a cheerful hand holding a smartphone with a gift box and gold coins spilling out.` },
  { name: "review_app_3", prompt: `${BASE} A bold layout with the Korean text "앱 리뷰 남기면 수수료 20%" clearly written across the top in two tidy lines, surrounded by five gold stars, a smartphone, and floating gold coins on a warm cream background. Festive and inviting.` },
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
  for (let i = 0; i < 8; i++) { try { return await genOnce(prompt); } catch (e) { lastErr = e; await sleep(6000 * (i + 1)); } }
  throw lastErr;
}
async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const b of BANNERS) {
    try { const { b64, mime } = await gen(b.prompt); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${b.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓ 생성:", b.name);
    } catch (e) { console.error("✗ 실패:", b.name, "—", e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
