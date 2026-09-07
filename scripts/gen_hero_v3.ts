// 메인 배너 화보 v3 — 인물이 프레임을 꽉 채움(여백 최소), 무텍스트, 정사각
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/luxury-affiliate-platform/public/banners";
const SQ = "SQUARE 1:1 composition.";
const NO = "NO text, NO letters, NO numbers, NO logos, NO watermark.";
const FILL = "The model FILLS the frame edge-to-edge — a close/medium crop from head to waist (or mid-thigh), subject large and dominant, background tight with MINIMAL empty space (no large empty walls/floor/sky). It's fine if the subject overlaps the lower area since a dark gradient will sit there for text.";
const BASE = `A genuine professional EDITORIAL FASHION PHOTOGRAPH (magazine/lookbook quality), medium-format film, real skin texture, natural hands, candid mood, looks like a REAL photo (NOT 3D/AI, no plastic skin). ${SQ} ${FILL} ${NO}`;

const SCENES = [
  { name: "vb1", prompt: `${BASE} A young Korean woman in a crisp IVORY/WHITE tailored look, soft luminous studio, waist-up close crop, elegant and clean.` },
  { name: "vb2", prompt: `${BASE} A chic Korean woman in a rich CAMEL coat inside a warm amber-lit luxury boutique, medium crop filling the frame, cinematic cozy tones.` },
  { name: "vb3", prompt: `${BASE} A Korean woman in a NAVY/GREY trench on an upscale city street, medium-close crop, cool moody palette, confident candid street-style.` },
  { name: "vb4", prompt: `${BASE} A Korean woman in a bold DEEP-RED or COBALT coat, medium studio crop against a softly textured matching backdrop, subject filling the frame, vibrant editorial.` },
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
  return img.inlineData.data as string;
}
async function gen(p: string) { let e: unknown; for (let i = 0; i < 8; i++) { try { return await genOnce(p); } catch (x) { e = x; await sleep(6000 * (i + 1)); } } throw e; }
async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const s of SCENES) {
    try { const b64 = await gen(s.prompt); writeFileSync(`${OUT}/${s.name}_raw.png`, Buffer.from(b64, "base64")); console.log("✓", s.name); }
    catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
