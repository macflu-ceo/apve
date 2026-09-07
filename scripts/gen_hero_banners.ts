// 메인 배너용 화보 이미지 — 인물 에디토리얼, 무텍스트, 정사각, 하단 문구 얹을 여백
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/luxury-affiliate-platform/public/banners";
const SQ = "SQUARE 1:1 composition.";
const NO = "NO text, NO letters, NO numbers, NO logos, NO watermark.";
const ROOM = "Keep the LOWER portion of the frame calmer/simpler (subject framed in the upper-center) so a headline can be overlaid at the bottom.";
const REAL = `A genuine professional EDITORIAL FASHION PHOTOGRAPH (lookbook / magazine campaign quality), shot on medium-format film, natural fine grain, TRUE realistic skin texture, natural hands, refined muted color, beautiful natural light. A single elegant young Korean model, sophisticated restrained luxury styling, natural candid 'captured' mood (not stiff). Looks like a REAL photo — NOT 3D, NOT AI, no plastic skin. ${SQ} ${ROOM} ${NO}`;

const SCENES = [
  { name: "hero1", prompt: `${REAL} Autumn outerwear editorial — model in a beautifully tailored light coat / quilted jacket, standing outdoors in soft bright natural daylight (airy forest or garden), fresh and aspirational.` },
  { name: "hero2", prompt: `${REAL} Soft studio lookbook — model in an elegant knit and skirt set holding a refined designer handbag, warm neutral backdrop, calm and chic.` },
  { name: "hero3", prompt: `${REAL} Minimal luxury studio portrait — model in a sophisticated outfit holding a structured designer handbag, clean off-white background, quiet-luxury editorial.` },
  { name: "hero4", prompt: `${REAL} Effortless street-style capture — model walking on an upscale city street in soft daylight with a designer bag, candid trendy editorial.` },
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
    try { const { b64 } = await gen(s.prompt); writeFileSync(`${OUT}/${s.name}_raw.png`, Buffer.from(b64, "base64")); console.log("✓", s.name); }
    catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
