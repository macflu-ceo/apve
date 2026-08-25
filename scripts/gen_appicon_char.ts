// 앱 아이콘 컨셉: 귀여운 캐릭터 + 명품백 + 코인
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/appicon";
const CHAR = "a cute chubby beige blob mascot character (soft slightly matte cream-beige body, big ROUND eyes with white eyeballs + dark pupils + tiny shine, tiny happy smile, little stubby arms)";
const BASE = "A polished mobile APP ICON, perfect square 1:1, clean bold CENTERED composition that reads clearly even at small sizes, soft 3D matte render, cute and premium. Warm beige background with a gentle radial glow so the subject pops; subtle soft shadow. Rich shiny GOLD COINS. A glossy BLACK quilted luxury handbag. No text, no letters, no numbers, no watermark.";
const ICONS = [
  { name: "pop_out", act: `${CHAR} joyfully popping up out of an open black luxury handbag, with shiny gold coins overflowing and spilling out around it` },
  { name: "hug_bag", act: `${CHAR} happily hugging a black luxury handbag from which shiny gold coins are pouring and overflowing` },
  { name: "sit_on", act: `${CHAR} sitting cheerfully on top of a black luxury handbag that overflows with gold coins spilling down the front` },
  { name: "peek_in", act: `${CHAR} peeking out with sparkly delighted eyes from inside a black luxury handbag that is packed and overflowing with gold coins` },
  { name: "beside", act: `${CHAR} clapping with delight beside a black luxury handbag tipped over with a big pile of gold coins pouring out` },
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
  for (const c of ICONS) {
    try { const { b64, mime } = await gen(`${BASE} Subject: ${c.act}.`); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${c.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", c.name);
    } catch (e) { console.error("✗", c.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
