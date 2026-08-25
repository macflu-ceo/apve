// 앱스토어 대표 이미지 — 밝은 하이엔드 캠페인 포토 (그래픽 배제, 폰 화면 정면, 세로, 무텍스트)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store";
const V = "TALL VERTICAL portrait (9:16, much taller than wide).";
const NO = "NO text, NO letters, NO numbers, NO logos, NO brand marks, NO watermark. PURE PHOTOGRAPHY — no graphic overlays, no floating icons, no illustrated coins/arrows, no composited elements.";
const PHOTO = `An OFFICIAL HIGH-END LUXURY BRAND CAMPAIGN photograph, editorial fashion-magazine quality, ${V} Sophisticated, trendy, aspirational. Elegant, well-styled young Korean model(s), refined chic wardrobe. BRIGHT, AIRY, LUMINOUS natural lighting — clean high-key, soft and fresh, gently warm, minimal shadows (NOT dark or moody). Shallow depth of field, crisp premium color grading, high production value. ${NO}`;
// 폰이 나오는 컷 공통 규칙
const PHONE = `The smartphone is held UPRIGHT and steady, its bright glowing SCREEN clearly facing outward toward the friend and the camera, showing a designer handbag on the screen. The phone screen (front) must be visible — NEVER the back of the phone, never upside-down or mirror-reversed; a normal, correct phone orientation.`;

const SCENES = [
  { name: "p1_stop", prompt: `${PHOTO} Scene: near the bright, elegant entrance of an upscale luxury department store, one refined young woman gently holds her chic friend's wrist to pause her, and turns her smartphone to show the screen. ${PHONE} Warm, candid, cheerful 'wait, look at this' moment.` },
  { name: "p2_dept_vs_online", prompt: `${PHOTO} Scene: inside a bright, elegant upscale luxury department store, one woman thoughtfully considers a designer handbag; in the soft-focus foreground another chic woman sits relaxed, happily looking at a handbag on her smartphone. ${PHONE} Light, sophisticated contrast.` },
  { name: "p3_street", prompt: `${PHOTO} Scene: a striking, fashionable young Korean woman on a bright upscale city street in soft daylight, holding a beautiful quilted designer handbag in one hand and her smartphone in the other, quiet confidence, fresh trendy street-style editorial, airy bokeh. ${PHONE}` },
  { name: "p4_hands", prompt: `${PHOTO} Editorial extreme close-up on a bright, clean background: elegant hands exchange — one hand offers a luxurious quilted designer handbag, another hand holds neatly folded cash. Soft luminous light, rich leather and gold hardware, refined and tactile.` },
  { name: "p5_boutique", prompt: `${PHOTO} Scene: a bright, airy, elegant ITALIAN luxury boutique interior — designer handbags beautifully displayed on wood shelves and marble in soft warm daylight streaming through large windows, clean and refined, aspirational empty-boutique campaign mood.` },
  { name: "p6_share", prompt: `${PHOTO} Scene: two stylish young friends close together in a bright, airy chic setting; one turns her smartphone to show the other, who reacts with a genuine delighted smile. ${PHONE} A luxury shopping bag rests beside them. Candid, warm, fresh premium lifestyle editorial.` },
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
