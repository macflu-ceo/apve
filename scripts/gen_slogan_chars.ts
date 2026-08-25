// 슬로건용 3D 캐릭터 대화 씬 (빈 말풍선 — 한글은 이후 오버레이) — Gemini
//   실행: npx tsx scripts/gen_slogan_chars.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/slogan";
const NO = "IMPORTANT: leave the speech bubble completely EMPTY and blank — absolutely no text, no letters, no numbers, no scribbles anywhere in the image.";
const BASE = "A cute, friendly 3D character illustration, Pixar/Blender style with soft rounded glossy shapes, cheerful and approachable. Warm cream and beige SIMPLE clean background, soft studio lighting, high quality. Square 1:1.";

const SCENES = [
  { name: "s1", prompt: `${BASE} Two young friends chatting: the character on the left cheerfully holds up a smartphone showing a shopping app, offering it to the friend on the right who holds a luxury designer handbag and looks pleasantly surprised. A large blank rounded speech bubble points from the left character (empty). ${NO}` },
  { name: "s2", prompt: `${BASE} Two friends: one gives a playful wink while pointing at a smartphone in their hand, the other reacts with a delighted 'oh!' expression holding a shopping bag. A big empty speech bubble above them (blank). Playful, casual mood. ${NO}` },
  { name: "s3", prompt: `${BASE} One character proudly holds a big luxury shopping bag; the other leans in and shows a phone screen with a discount tag, as if saying a secret tip. A large blank speech bubble on top (empty). Cozy, fun. ${NO}` },
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
