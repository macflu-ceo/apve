// 돈 버는/들어오는 캐릭터 세트 (컷아웃용 단색배경)
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/char";
const CHAR = "the SAME cute chubby beige blob 3D character (soft SLIGHTLY MATTE cream-beige body, NOT overly glossy). Eyes: big ROUND cartoon eyes with WHITE eyeballs and dark round pupils plus a tiny white shine (NOT plain black dots), tiny smile, little stubby arms and feet. Full body, centered, single character.";
const BG = "On a FLAT SOLID pastel sky-blue background (one even color, no gradient), so the character clearly stands out for easy cut-out. Soft small contact shadow only. Square. No text, no letters, no numbers, no currency symbols.";
const POSES = [
  { name: "cash_rain", act: "cheering with both little arms up, a HUGE joyful smile, as shiny gold coins and cash bundles RAIN DOWN from above around it" },
  { name: "phone_earn", act: "holding a smartphone with sparkly excited eyes while a burst of shiny gold coins POURS OUT of the phone screen — like earning money from the app" },
  { name: "hug_cash", act: "happily hugging a big bundle of cash and gold coins to its chest with blissful heart-shaped eyes" },
  { name: "coin_throne", act: "sitting contentedly on top of a big pile of shiny gold coins, looking rich and satisfied" },
  { name: "cash_fan", act: "holding a fanned-out spread of cash bills in its little hands with a sly delighted grin, a few gold coins floating nearby" },
  { name: "piggy", act: "cheerfully dropping a gold coin into a cute pink piggy bank with a satisfied smile" },
  { name: "bag_coins", act: "clapping with delight next to a black quilted luxury handbag that is OVERFLOWING with shiny gold coins" },
  { name: "money_lounge", act: "lying back and relaxing happily on a comfy bed of cash bills and gold coins, super chill and rich" },
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
      writeFileSync(`${OUT}/money_${p.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", p.name);
    } catch (e) { console.error("✗", p.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
