// 베타오픈 랜딩용 캐릭터 3컷 (크림 배경 — 랜딩과 자연스럽게 블렌드)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/dc-work/img";
const CHAR = "a cute chubby beige blob mascot (soft matte cream body, big round CUTE eyes with white eyeballs + dark pupils + tiny shine, happy smile, little stubby arms)";
const BG = "On a soft plain WARM CREAM / light-beige background (single even soft color, gentle radial glow, no scenery), so it blends into a cream landing page. Soft small contact shadow. Square. No text, no letters, no numbers.";
const SCENES = [
  { name: "hero", act: `${CHAR} joyfully WAVING hello with one arm raised in a cheerful welcome, a couple of gold coins and small sparkles floating nearby` },
  { name: "link", act: `${CHAR} holding up a smartphone that shows a glowing shopping link, pointing at it with a delighted smile, one gold coin floating` },
  { name: "cash", act: `${CHAR} happily holding a small stack of cash and a few shiny gold coins to its chest, content and rich` },
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
    try { const { b64, mime } = await gen(`A cute 3D character illustration of ${s.act}. ${BG}`); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${s.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", s.name);
    } catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
