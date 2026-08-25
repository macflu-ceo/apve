// 앱스토어 대표 이미지 — 진짜 브랜드 캠페인 퀄리티 (필름·자연광·리얼, 세로, 무텍스트, 폰 무관)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store2";
const V = "TALL VERTICAL portrait (9:16, much taller than wide).";
const NO = "NO text, NO letters, NO numbers, NO logos, NO brand marks, NO watermark.";
const REAL = "A genuine professional EDITORIAL PHOTOGRAPH for a high-end luxury fashion brand campaign (Vogue / Harper's Bazaar quality). " +
  "Shot on MEDIUM-FORMAT FILM (Hasselblad, Kodak Portra 400), 80mm lens, natural fine film grain, TRUE realistic skin texture with pores and subtle natural imperfections, natural realistic hands, authentic candid mood. " +
  "Elegant, sophisticated, aspirational; restrained tasteful luxury styling. Beautiful natural directional window light with soft real shadows and a refined muted color palette (not oversaturated, not glossy). " +
  "This must look like a REAL photograph — NOT a 3D render, NOT digital art, NOT AI-generated, no plastic skin, no over-smoothing. " + NO;

const SCENES = [
  { name: "l1_portrait", prompt: `${REAL} ${V} An elegant young Korean woman in a beautifully tailored wool coat holds a structured quilted designer handbag, standing in a refined minimal luxury boutique with soft daylight from a large window. Poised, understated editorial portrait.` },
  { name: "l2_friends", prompt: `${REAL} ${V} Two chic young Korean women in a sophisticated luxury boutique; one admires a designer handbag the other elegantly holds up to show her. Natural candid interaction, refined and warm.` },
  { name: "l3_boutique", prompt: `${REAL} ${V} An atmospheric high-end Italian luxury boutique interior — designer handbags elegantly arranged on marble and warm wood shelving, soft natural window light, refined architectural campaign still life, no people.` },
  { name: "l4_bagdetail", prompt: `${REAL} ${V} Editorial close-up: elegant hands gracefully holding a luxurious quilted lambskin designer handbag with gold hardware, rich leather texture, soft natural side light, refined and tactile.` },
  { name: "l5_street", prompt: `${REAL} ${V} A stylish young Korean woman stepping out of a luxury boutique onto an upscale street, carrying an elegant shopping bag and a designer handbag, soft natural daylight, effortless high-fashion street-style editorial.` },
  { name: "l6_lounge", prompt: `${REAL} ${V} An elegant young Korean woman seated gracefully in a refined boutique lounge, a beautiful designer handbag resting on her lap, looking away thoughtfully, soft window light, quiet luxury lifestyle editorial.` },
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
