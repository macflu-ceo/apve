// 명품 캐릭터 다양한 포즈 세트 — 배경 대비 단색(선 따기/컷아웃 용이)
//   실행: npx tsx scripts/gen_char_poses.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/char";

// 동일 캐릭터 고정 묘사 (매트 질감 + 흰자 있는 동그란 눈)
const CHAR = "the SAME cute chubby beige blob 3D character (soft SLIGHTLY MATTE cream-beige body, gently rounded — NOT overly glossy or plastic-shiny). IMPORTANT eyes: big ROUND cartoon eyes with WHITE eyeballs and dark round pupils plus a tiny white shine — expressive cute googly eyes, NOT plain solid black dots. Tiny simple smile, little stubby arms and feet. Full body, centered, single character.";
// 컷아웃 용이: 대비되는 평면 단색 배경
const BG = "Placed on a FLAT SOLID pastel sky-blue background (one even color, NO gradient, no scenery), so the beige character clearly stands out and can be easily cut out. Soft small contact shadow under the character only. Square image. No text, no letters, no numbers, no watermark.";

const POSES = [
  // 감정 리액션 위주
  { name: "hearts_bag", act: "with big pink HEART-SHAPED eyes, totally in love, hugging a black quilted luxury handbag — utterly smitten" },
  { name: "surprised_price", act: "with a SHOCKED jaw-drop face (mouth wide open, huge round eyes, tiny hands on cheeks), amazed and surprised while looking at a luxury handbag, as if stunned by an unbelievable deal" },
  { name: "wow_phone", act: "eyes SPARKLING with amazement, mouth open in an excited 'wow', looking at a smartphone showing a shopping deal" },
  { name: "excited_jump", act: "JUMPING with joy, little arms thrown up, thrilled and super excited, luxury shopping bags bouncing around it" },
  { name: "starstruck_shoe", act: "with STAR-STRUCK sparkling eyes and both little hands on its cheeks, adoring a luxury high-heel shoe it holds up" },
  { name: "kiss_bag", act: "lovingly nuzzling and kissing a mini luxury handbag, eyes closed in bliss with little hearts floating" },
  { name: "crying_happy", act: "with HAPPY TEARS of joy sparkling in its eyes, overwhelmed and delighted while holding a luxury designer bag close" },
  // 아이템 착용/터치
  { name: "sunglasses", act: "wearing stylish oversized luxury sunglasses, posing cool and confident with one little arm up" },
  { name: "shopping", act: "cheerfully carrying several luxury shopping bags in its little arms, beaming with a huge happy smile" },
  { name: "scarf", act: "wearing a silky luxury patterned scarf around its neck, feeling fabulous with a proud smile" },
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
    const prompt = `A cute 3D character illustration: ${CHAR} The character is ${p.act}. ${BG}`;
    try { const { b64, mime } = await gen(prompt); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${p.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", p.name);
    } catch (e) { console.error("✗", p.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
