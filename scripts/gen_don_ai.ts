// "돈" 레퍼런스 이미지를 넣어 → S자 붓 캘리그라피 로고로 AI 리스타일 (한글 안 깨지게)
import "./loadenv";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/icon";
const REF = "/Users/leegeungjeong/luxury-affiliate-platform/scripts/icon/ref_don.png";
const refB64 = readFileSync(REF).toString("base64");

const KEEP = "The reference image shows the exact Korean word '돈' (two syllables: 도+ㄴ). Keep these EXACT same Korean letter shapes and spelling — do NOT change, replace, add or remove any letters, do NOT turn it into other characters. Same word '돈', just restyled.";
const NO = "NO extra text, NO latin letters, NO numbers, NO other words besides the styled '돈'.";

const SCENES = [
  { name: "don_brush_coral", prompt: `${KEEP} Restyle it as an elegant, flowing KOREAN BRUSH CALLIGRAPHY logo — smooth curvy ink strokes with a graceful S-like flow, tapered brush ends, dynamic and premium. Solid warm CORAL color (#e5623f) on a clean white background, single color, flat, high-end brand logo. Add a tiny sparkle accent. ${NO}` },
  { name: "don_neon_coral", prompt: `${KEEP} Restyle it as a sleek, modern glossy calligraphic wordmark with smooth rounded curvy strokes flowing like an S, coral (#e5623f) gradient, soft 3D glossy finish on a clean light background, trendy premium logo. ${NO}` },
  { name: "don_gold_lux", prompt: `${KEEP} Restyle it as a luxurious flowing calligraphy wordmark, elegant curvy S-shaped brush strokes, rich GOLD color with subtle sheen on a deep warm cream background, high-end luxury brand logo. ${NO}` },
  { name: "don_ink_black", prompt: `${KEEP} Restyle it as bold artistic Korean brush ink calligraphy, expressive wet-brush strokes with natural bristle texture and a strong S flow, solid black ink on white paper, striking and premium. ${NO}` },
  { name: "don_tile_coral", prompt: `${KEEP} Restyle it as a clean minimal app-icon: the '돈' as smooth flowing white brush-calligraphy strokes (S-like flow) centered on a solid coral (#e5623f) rounded-square tile filling the frame, simple and iconic, tiny sparkle. ${NO}` },
  { name: "don_brush_coral2", prompt: `${KEEP} Restyle it as a very simple, bold, curvy single-stroke brush calligraphy logo, strong S-shaped flow, thick smooth coral (#e5623f) strokes on white, minimal and iconic. ${NO}` },
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function genOnce(p: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": KEY as string },
    body: JSON.stringify({ contents: [{ role: "user", parts: [
      { text: p }, { inlineData: { mimeType: "image/png", data: refB64 } } ] }] }) });
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
