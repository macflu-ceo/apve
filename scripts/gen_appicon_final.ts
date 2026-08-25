// 앱 아이콘 최종: 꽉 찬 정사각(모서리 안 둥글게) + 대비 강한 단색 배경
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/appicon";
const SUBJECT = "a cute chubby beige blob mascot (soft matte cream body, big round eyes with white + dark pupils + shine, happy smile) joyfully popping up out of an open glossy BLACK quilted luxury handbag, with shiny GOLD COINS overflowing and spilling around it";
const BASE = "A mobile app icon. FULL-BLEED perfect SQUARE, edge to edge — the solid background color FILLS THE ENTIRE SQUARE. NO rounded corners, NO frame, NO border, no padding. Centered, bold, clean, soft 3D matte render, cute and premium, high contrast so the subject clearly pops off the background. No text, no letters, no numbers, no watermark.";
const COLORS = [
  { name: "coral", bg: "a solid vivid CORAL RED background (single flat warm color)" },
  { name: "teal", bg: "a solid vivid TEAL / emerald green background (single flat color)" },
  { name: "blue", bg: "a solid bright PERIWINKLE BLUE background (single flat color)" },
  { name: "pink", bg: "a solid bright bubblegum PINK background (single flat color)" },
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
  for (const c of COLORS) {
    try { const { b64, mime } = await gen(`${BASE} Background: ${c.bg}. Subject: ${SUBJECT}.`); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/final_${c.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", c.name);
    } catch (e) { console.error("✗", c.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
