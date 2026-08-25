// 앱스토어 세로형 대표 이미지 — "백화점 가는 친구 말리기" (실사 기반 + 그래픽 약간, 무텍스트)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/store";
const BASE = "A high-quality PHOTOREALISTIC advertising photo, TALL VERTICAL portrait (9:16, much taller than wide). Real, natural-looking young Korean people (candid, no specific celebrity faces). Cinematic warm lighting, premium mobile-commerce ad look. Add SUBTLE modern composited GRAPHIC elements (soft glow, a floating product, a few gold coins, a gentle light arrow) blended tastefully into the photo. Warm cream and coral tone. Absolutely NO text, NO letters, NO numbers, NO logos, NO watermark anywhere.";
const SCENES = [
  { name: "stop1", prompt: `${BASE} Scene: a young woman playfully GRABS her friend's arm to stop her from walking into a glowing luxury DEPARTMENT STORE entrance in the background, while holding up her smartphone. Above the phone, a designer handbag floats as a soft 3D graphic surrounded by a few gold coins — suggesting a cheaper price and earning. Fun, urgent, friendly energy.` },
  { name: "stop2", prompt: `${BASE} Scene: a city street at golden hour. One stylish friend is heading toward a bright department store; another friend pulls her back by the hand and excitedly shows a phone. A floating designer bag and gold coins are composited above the phone screen, with a soft glowing arrow pointing from the phone toward the friend.` },
  { name: "stop3", prompt: `${BASE} Scene: a warm close moment between two friends; one shows the other a smartphone where a luxury handbag lifts out of the screen as a glossy 3D graphic surrounded by floating gold coins. A grand luxury department store is softly blurred in the background. Photoreal people with a subtle graphic product float.` },
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
