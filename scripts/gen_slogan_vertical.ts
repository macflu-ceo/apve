// 세로형 슬로건 씬 — 작은 캐릭터 + 큰 여백 + 빈 말풍선 (한글은 이후 오버레이)
//   실행: npx tsx scripts/gen_slogan_vertical.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/slogan";
const NO = "The speech bubble must be COMPLETELY EMPTY and blank — absolutely no text, letters, numbers or scribbles anywhere in the image.";
const BASE = "A TALL VERTICAL portrait image (9:16 aspect, much taller than wide). Cute 3D Pixar/Blender style, soft glossy rounded shapes. The two characters are SMALL and placed in the CENTER of the frame with LOTS of generous empty margin/space on ALL sides (big empty space above, below, left and right). Plain soft warm-beige background, minimal and clean, gentle even lighting.";

const SCENES = [
  { name: "v1", prompt: `${BASE} A neat empty rounded speech bubble sits above the two small characters. The left character cheerfully holds up a smartphone showing a shopping app toward the right character, who holds a small black quilted luxury handbag with a delighted surprised face. ${NO}` },
  { name: "v2", prompt: `${BASE} Above the two small characters is a clean empty speech bubble. One character winks playfully while pointing at a phone in their hand; the other reacts happily holding a little shopping bag. ${NO}` },
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
