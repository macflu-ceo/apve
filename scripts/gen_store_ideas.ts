// 앱스토어 대표 이미지 — 하이엔드 캠페인 포토 무드 (에디토리얼·무디·트렌디, 세로, 무텍스트)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store";
const V = "TALL VERTICAL portrait (9:16, much taller than wide).";
const NO = "NO text, NO letters, NO numbers, NO logos, NO brand marks, NO watermark anywhere.";
// 하이엔드 캠페인 포토
const PHOTO = `An OFFICIAL HIGH-END LUXURY BRAND CAMPAIGN photograph, editorial fashion-magazine quality, ${V} Sophisticated, trendy and aspirational. Elegant, well-styled young Korean model(s), refined chic wardrobe. MOODY cinematic lighting with soft deep shadows and warm golden highlights, shallow depth of field, film-like premium color grading, high production value. Tasteful, understated GOLD graphic accents only. ${NO}`;
// 프리미엄 그래픽 키비주얼
const GFX = `A PREMIUM, ELEGANT 3D graphic key visual, luxury editorial quality, ${V} Sophisticated moody palette of warm cream, deep espresso and gold, refined and trendy, cinematic depth, glossy high-end materials, dramatic soft lighting. ${NO}`;

const SCENES = [
  { name: "01_stop", prompt: `${PHOTO} Scene: inside/near an ATMOSPHERIC, moody upscale department store with dramatic warm lighting, one elegant woman gently holds her chic friend's wrist to stop her, while lifting a smartphone; a single designer handbag and a few gold coins float above the phone as a refined golden graphic. Editorial, sophisticated 'wait — there's a better way' mood.` },
  { name: "02_dept_vs_online", prompt: `${PHOTO} Scene: a moody, elegant luxury department store interior; a stylish woman considers a designer handbag under a spotlight, while in soft-focus foreground another chic woman relaxes and views the same bag on her phone, a subtle glowing golden price graphic (no numbers) floating. Refined before/after contrast, cinematic.` },
  { name: "03_city_halo", prompt: `${PHOTO} Scene: a striking, fashionable young Korean model on an upscale city street at blue-golden hour, holding a smartphone with quiet confidence; luxury pieces — a handbag, a watch, sunglasses — float elegantly around them with a subtle golden glow halo. Trendy street-style editorial.` },
  { name: "04_hands", prompt: `${PHOTO} Editorial extreme close-up on elegant manicured hands: one hand passes a beautiful quilted designer handbag, while gold coins and a folded note flow back to the other hand. Moody warm bokeh, luxurious materials, subtle gold sparkle graphic. Refined 'recommend and earn'.` },
  { name: "05_italy_korea", prompt: `${GFX} An elegant stylized dark globe with a glowing golden ARC sweeping from ITALY to KOREA; refined luxury handbags, gift boxes and gold coins glide along the arc, a subtle miniature plane, soft luminous clouds. Sophisticated 'Italian boutique to Korea, direct' key visual.` },
  { name: "06_phone_pop", prompt: `${GFX} An elegant hand holds up a sleek smartphone and a glossy luxury handbag rises gracefully OUT of the screen in premium 3D, a refined golden light-arrow delivering it toward an open hand, a few gold coins drifting. Dramatic, high-end pop-out.` },
  { name: "07_loop", prompt: `${GFX} A sophisticated circular motion (no text): a sleek phone sends an elegant luxury handbag toward a refined silhouette on one side, while a graceful stream of gold coins loops back to the sender, luminous golden arrows forming a smooth premium cycle on a moody dark-cream backdrop.` },
  { name: "08_pour", prompt: `${GFX} A sleek smartphone held upright while elegant luxury shopping bags, gift boxes and a cascade of gold coins pour gracefully out of the screen against a moody warm gradient, refined confetti of light. Luxurious, dynamic yet tasteful.` },
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
      writeFileSync(`${OUT}/lux_${s.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", s.name);
    } catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
