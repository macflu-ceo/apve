// 메인 배너 화보 v2 — 색감·배경·구도 다양하게, 무텍스트, 정사각, 하단 문구 여백
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/luxury-affiliate-platform/public/banners";
const SQ = "SQUARE 1:1 composition.";
const NO = "NO text, NO letters, NO numbers, NO logos, NO watermark.";
const ROOM = "Frame the subject in the UPPER-CENTER so the lower third stays calmer for a headline+subtext overlay.";
const BASE = `A genuine professional EDITORIAL FASHION PHOTOGRAPH (magazine/lookbook quality), medium-format film, real skin texture, natural hands, candid 'captured' mood, looks like a REAL photo (NOT 3D/AI, no plastic skin). ${SQ} ${ROOM} ${NO}`;

const SCENES = [
  { name: "hv1", prompt: `${BASE} HIGH-KEY BRIGHT studio: a young Korean woman in a crisp all-WHITE/ivory look, luminous airy white background, fresh and clean, minimal.` },
  { name: "hv2", prompt: `${BASE} MOODY warm boutique interior: a chic Korean woman in a rich CAMEL & CHOCOLATE outfit under warm amber lighting, deep cozy tones, cinematic.` },
  { name: "hv3", prompt: `${BASE} COOL outdoor street: a Korean woman in a grey trench walking on a rainy-clean city street, cool blue-grey palette, dynamic candid street-style.` },
  { name: "hv4", prompt: `${BASE} COLOR-POP studio: a Korean woman in a bold JEWEL-TONE (emerald or cobalt blue) coat against a soft complementary color backdrop, vibrant editorial.` },
  { name: "hv5", prompt: `${BASE} A confident Korean MAN in a refined tailored suit/coat, upscale minimal setting, quiet-luxury menswear editorial (variety of subject).` },
  { name: "hv6", prompt: `${BASE} DETAIL-forward: a Korean woman seated elegantly in a designer armchair holding a colorful statement handbag, soft pastel interior, relaxed lifestyle editorial.` },
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
  return img.inlineData.data as string;
}
async function gen(p: string) { let e: unknown; for (let i = 0; i < 8; i++) { try { return await genOnce(p); } catch (x) { e = x; await sleep(6000 * (i + 1)); } } throw e; }
async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const s of SCENES) {
    try { const b64 = await gen(s.prompt); writeFileSync(`${OUT}/${s.name}_raw.png`, Buffer.from(b64, "base64")); console.log("✓", s.name); }
    catch (e) { console.error("✗", s.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
