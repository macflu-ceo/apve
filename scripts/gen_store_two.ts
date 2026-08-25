// 백화점 배경 + 여자 2명 — 캠페인 퀄리티 베리에이션 (필름·자연광·리얼, 세로, 무텍스트)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store2";
const V = "TALL VERTICAL portrait (9:16, much taller than wide).";
const NO = "NO text, NO letters, NO numbers, NO logos, NO brand marks, NO watermark.";
const REAL = "A genuine professional EDITORIAL PHOTOGRAPH for a high-end luxury fashion brand campaign (Vogue / Harper's Bazaar quality). " +
  "Shot on MEDIUM-FORMAT FILM (Hasselblad, Kodak Portra 400), 80mm lens, natural fine film grain, TRUE realistic skin texture with pores and subtle natural imperfections, natural realistic hands, authentic candid mood. " +
  "TWO elegant young Korean women, sophisticated restrained luxury styling, natural genuine expressions. Setting is a refined, atmospheric LUXURY DEPARTMENT STORE / boutique with designer handbags on display. Beautiful natural directional window light, soft real shadows, refined muted color (not oversaturated, not glossy). " +
  "Must look like a REAL photograph — NOT a 3D render, NOT digital art, NOT AI-generated, no plastic skin, no over-smoothing. " + NO;

const SCENES = [
  { name: "t1", prompt: `${REAL} ${V} One woman holds up a beautiful quilted designer handbag to show her friend, who admires it with a warm genuine smile; a lit display of designer bags behind them.` },
  { name: "t2", prompt: `${REAL} ${V} The two friends browse a shelf wall of designer handbags together, one gently pointing at a bag, both engaged and elegant, warm boutique light.` },
  { name: "t3", prompt: `${REAL} ${V} At an elegant marble luxury counter, one woman tries a designer handbag over her shoulder while her friend beside her looks and smiles, refined and candid.` },
  { name: "t4", prompt: `${REAL} ${V} The two stylish friends walk together through a grand, softly lit luxury department store hall lined with designer boutiques, carrying elegant shopping bags, effortless editorial.` },
  { name: "t5", prompt: `${REAL} ${V} The two women sit close in a refined boutique lounge, a beautiful designer handbag resting between them, chatting warmly, quiet-luxury lifestyle editorial.` },
  { name: "t6", prompt: `${REAL} ${V} A candid joyful moment: two friends laughing softly together as one holds a designer handbag, a warm blurred boutique display behind them.` },
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
      writeFileSync(`${OUT}/two_${s.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", s.name);
    } catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
