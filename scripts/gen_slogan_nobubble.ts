// 말풍선 없는 캐릭터 씬 (세로 의도, 작은 캐릭터+큰 여백) — 3D 글자는 이후 오버레이
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/slogan";
const NO = "Do NOT draw any speech bubble, thought bubble, sign, board or text anywhere — none. No letters, no numbers.";
const BASE = "Cute 3D Pixar/Blender style, soft glossy rounded blob characters. The two characters are SMALL and placed toward the CENTER-LOWER area with LOTS of generous empty space above them and margins on all sides. Plain soft warm-beige background, minimal and clean, gentle even lighting. Square image.";
const SCENES = [
  { name: "nb1", prompt: `${BASE} The left blob character cheerfully holds up a smartphone showing a shopping app toward the right blob character, who holds a small black quilted luxury handbag and has a delighted happy face. Big empty beige space in the upper half of the frame. ${NO}` },
  { name: "nb2", prompt: `${BASE} Two happy blob characters standing close; one shows a phone screen, the other gives a cheerful thumbs-up while a tiny luxury shopping bag sits beside them. Lots of empty beige space above. ${NO}` },
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
