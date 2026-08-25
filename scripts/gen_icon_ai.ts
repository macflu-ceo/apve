// 팔찌 2개 = $ 단색 미니멀 앱 아이콘 (AI 생성, 여러 장 → 선별)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/icon";
const NO = "Absolutely NO text, NO letters, NO words, NO numbers, NO typography anywhere.";
const base = (color: string, bg: string, mark: string) =>
  `A minimal, modern FLAT VECTOR app icon logo. ${mark} ` +
  `Design: a stylized DOLLAR-SIGN ($) money symbol formed by TWO simple bangle BRACELETS — two clean rounded rings/loops overlapping vertically like linked bracelets — with ONE straight vertical bar passing through them. Thick, smooth, ROUNDED strokes, geometric, perfectly symmetrical, iconic. A small cute 4-POINT SPARKLE star at the upper-left of the mark. ` +
  `Style: single solid ${color} color, ${bg}, pure flat design — NO gradient, NO shadow, NO 3D, NO texture, high contrast, crisp vector edges, centered with generous negative space, premium Dribbble/Behance logomark quality, 1:1 square. ${NO}`;

const SCENES = [
  { name: "ai_blue_white_1", prompt: base("cobalt blue (#1f6fe5)", "on a pure white background", "") },
  { name: "ai_blue_white_2", prompt: base("cobalt blue (#1f6fe5)", "on a pure white background", "Very simple and bold.") },
  { name: "ai_coral_white_1", prompt: base("warm coral (#e5623f)", "on a pure white background", "") },
  { name: "ai_coral_white_2", prompt: base("warm coral (#e5623f)", "on a pure white background", "Very simple and bold.") },
  { name: "ai_white_coral_tile", prompt: base("white", "on a solid warm coral (#e5623f) rounded-square app-icon tile filling the whole frame", "App icon tile.") },
  { name: "ai_white_blue_tile", prompt: base("white", "on a solid cobalt blue (#1f6fe5) rounded-square app-icon tile filling the whole frame", "App icon tile.") },
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
