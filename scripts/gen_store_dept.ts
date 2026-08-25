// 백화점 무드 (분위기 있는 웜톤) + 폰 화면이 카메라를 향하는 구도 — 여러 장 뽑아 선별
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store";
const V = "TALL VERTICAL portrait (9:16, much taller than wide).";
const NO = "NO text, NO letters, NO numbers, NO logos, NO brand marks, NO watermark. PURE PHOTOGRAPHY — no graphic overlays.";
const PHOTO = `An OFFICIAL HIGH-END LUXURY BRAND CAMPAIGN photograph, editorial fashion-magazine quality, ${V} Elegant, well-styled young Korean model(s), refined chic wardrobe. WARM, ATMOSPHERIC, cinematic department-store lighting — rich golden tones with soft glow and gentle shadows, moody-yet-inviting, sophisticated and premium (well-exposed, not washed out, not too dark). Shallow depth of field, film-like color grading. ${NO}`;
// 폰 방향 — 화면이 카메라를 향하게 강제
const PHONE = `CRITICAL: the smartphone is angled so its bright glowing SCREEN (the FRONT with the display) faces the CAMERA and viewer directly, clearly showing a designer handbag photo on the screen. We must SEE the phone's screen. Do NOT show the flat blank BACK of the phone; do NOT show the camera lenses; never upside-down.`;

const SCENES = [
  { name: "d1", prompt: `${PHOTO} Setting: a warm, atmospheric luxury department store handbag hall. In the foreground a chic woman sits relaxed and holds her smartphone UP toward the camera, delighted; ${PHONE} Behind her, softly out of focus, another elegant woman examines a designer bag on a display.` },
  { name: "d2", prompt: `${PHOTO} Setting: a warm luxury department store shelf of designer bags. Over-the-shoulder from BEHIND a woman, so the camera looks past her shoulder and clearly SEES her phone's screen in her hand showing the same designer bag, with the lit boutique shelf ahead. ${PHONE}` },
  { name: "d3", prompt: `${PHOTO} Setting: a warm elegant boutique inside a department store. Two friends: one reaches toward a designer bag on a lit shelf, the other turns and holds her smartphone toward the camera with a smile, screen facing us. ${PHONE}` },
  { name: "d4", prompt: `${PHOTO} Setting: a warm marble luxury counter. A smartphone lies FACE-UP on the counter (screen visible from above) showing a designer handbag, next to an elegant real handbag; a chic woman's hands nearby. Top-down warm still-life feel. ${PHONE}` },
  { name: "d5", prompt: `${PHOTO} Setting: a warm luxury department store lounge; an elegant woman seated on a sofa holds her smartphone toward the camera showing a designer bag, softly smiling, a glowing bag display behind her. ${PHONE}` },
  { name: "d6", prompt: `${PHOTO} Setting: a warm, atmospheric luxury boutique inside a department store. A single elegant woman gracefully examines a beautiful quilted designer handbag under a soft golden spotlight, glossy shelves of bags behind. No phone — pure elegant shopping moment.` },
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
      writeFileSync(`${OUT}/dept_${s.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", s.name);
    } catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
