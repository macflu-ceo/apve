// #1 회사소개 랜딩 섹션 이미지 (풀블리드, 텍스트 없음) — Gemini
//   실행: npx tsx scripts/gen_landing_company.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/luxury-affiliate-platform/public/landing";
const NO = "No text, no letters, no numbers, no words, no watermark, no logo.";
const IMGS = [
  { name: "company_hero", prompt: `A cinematic, premium WIDE 16:9 hero image: an elegant Italian luxury boutique storefront on a charming European street at warm golden hour, sophisticated designer window displays, refined and inviting editorial luxury mood, photorealistic, high quality. ${NO}` },
  { name: "company_sourcing", prompt: `Inside a high-end Italian luxury boutique: shelves and tables displaying designer handbags and premium goods, a direct-from-boutique atmosphere, warm elegant lighting, refined, photorealistic. ${NO}` },
  { name: "company_authentic", prompt: `A single luxury designer handbag with elegant premium gift packaging and a tissue-wrapped unboxing feel, clean warm studio background, conveying guaranteed 100% authenticity and quality, photorealistic. ${NO}` },
  { name: "company_share", prompt: `A friendly young Korean person smiling while sharing a luxury product link on a smartphone, warm bright modern room, a few gold coins subtly suggesting reward/earnings, approachable and premium, photorealistic. ${NO}` },
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
  for (const b of IMGS) {
    try { const { b64, mime } = await gen(b.prompt); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${b.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", b.name);
    } catch (e) { console.error("✗", b.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
