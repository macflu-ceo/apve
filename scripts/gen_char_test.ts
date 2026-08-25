// 눈/질감 스타일 테스트 (2컷)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/char";
const CHAR = "a cute chubby beige blob 3D character (soft SLIGHTLY MATTE cream-beige body, gently rounded — NOT overly glossy or plastic-shiny). IMPORTANT eyes: big ROUND cartoon eyes with WHITE eyeballs and dark round pupils plus a tiny white shine — expressive cute googly eyes, NOT plain solid black dots. Tiny simple smile, little stubby arms and feet. Full body, centered, single character.";
const BG = "On a FLAT SOLID pastel sky-blue background (one even color, no gradient), so the beige character clearly stands out for easy cut-out. Soft small contact shadow only. Square. No text.";
const POSES = [
  { name: "test_surprised", act: "with a shocked jaw-drop face (mouth wide open, hands on cheeks), amazed at a white luxury handbag as if stunned by an unbelievable deal" },
  { name: "test_hearts", act: "with big pink heart-shaped pupils, totally in love, hugging a black quilted luxury handbag" },
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
  for (const p of POSES) {
    try { const { b64, mime } = await gen(`A cute 3D character illustration of ${CHAR} The character is ${p.act}. ${BG}`); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${p.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", p.name);
    } catch (e) { console.error("✗", p.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
