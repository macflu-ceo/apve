// 코랄 배경 + 돈·명품 아이콘 둥둥 떠다니는 배경 이미지 (세로, 무텍스트)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store2";
const V = "TALL VERTICAL portrait (9:16, much taller than wide).";
const NO = "NO text, NO letters, NO numbers, NO brand logos, NO watermark.";
// 코랄(핑크에 가까운 브랜드 포인트 컬러 #e5623f) 배경
const CORAL = `${V} A premium, playful 3D floating-icons background. Warm CORAL / coral-pink gradient background (soft #f2865f to #e5623f to #c94a2c), clean and modern. ` +
  "Cute glossy 3D icons of luxury + money float and drift around the whole frame with soft realistic drop shadows and gentle depth-of-field: elegant quilted designer HANDBAGS, stacks and single gold COINS, a golden DOLLAR sign, small GIFT boxes with ribbons, sparkling DIAMONDS/gems, a little shopping bag. " +
  "Icons are gold, cream and soft accents so they pop against the coral. Balanced, airy composition, tasteful negative space, brand-campaign quality, soft studio lighting, subtle bokeh sparkles. Cute yet premium. " + NO;

const SCENES = [
  { name: "bg1_airy", prompt: `${CORAL} Airy and minimal — fewer, larger icons drifting with lots of clean coral negative space, elegant and premium.` },
  { name: "bg2_rich", prompt: `${CORAL} Rich and abundant — many luxury + money icons joyfully floating and overflowing across the frame, lively celebratory density (still balanced, not cluttered).` },
  { name: "bg3_center", prompt: `${CORAL} A clear calm open area in the CENTER (for a logo later), with the floating luxury + money icons arranged around the edges as a soft frame.` },
  { name: "bg4_pattern", prompt: `${CORAL} A softly repeating, evenly-scattered pattern of small floating luxury + money icons across the whole coral field, gentle and uniform, wallpaper-like.` },
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function genOnce(p: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY as string },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: p }] }] }) });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error?.message || `HTTP ${res.status}`);
  const img = (d?.candidates?.[0]?.content?.parts ?? []).find((x: { inlineData?: { data?: string } }) => x?.inlineData?.data);
  if (!img) throw new Error("이미지 없음");
  return { b64: img.inlineData.data as string, mime: (img.inlineData.mimeType as string) || "image/png" };
}
async function gen(p: string) { let e: unknown; for (let i = 0; i < 8; i++) { try { return await genOnce(p); } catch (x) { e = x; await sleep(6000 * (i + 1)); } } throw e; }
async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const s of SCENES) {
    try { const { b64, mime } = await gen(s.prompt); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${s.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", s.name);
    } catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
