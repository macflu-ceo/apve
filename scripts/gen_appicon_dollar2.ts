// 앱 아이콘 v2: 귀여운 눈(흰자+검은눈동자) 안에 작은 $ 반짝 + 가방 더 크게
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/appicon";
const BASE = "A bold mobile APP ICON. FULL SQUARE, edge to edge — solid background fills the ENTIRE square, NO rounded corners, NO frame. Subject LARGE, fills most of the frame, simple and iconic, MAXIMUM contrast. Solid vivid CORAL RED background (single flat color). Cute soft matte 3D.";
const SUBJ = "the cute chubby beige blob mascot with big round CUTE friendly eyes — each eye has a WHITE eyeball and a LARGE BLACK round pupil (normal adorable eyes), and a tiny shiny golden DOLLAR-SIGN '$' sparkle glint sits inside each black pupil like a cute money-loving twinkle (keep it cute and friendly, NOT scary). A wide happy open smile. The mascot hugs a BIG, LARGE and prominent plain black quilted luxury handbag with a small simple gold clasp — the bag has NO brand logo, NO monogram, no 'CC' mark. NO coins.";
const RULE = "The only symbol is the small '$' glint inside the black pupils. No other text, letters, numbers, brand logos or watermarks.";
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
  for (const n of ["e1", "e2", "e3"]) {
    try { const { b64, mime } = await gen(`${BASE} Subject: ${SUBJ} ${RULE}`); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/dol2_${n}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", n);
    } catch (e) { console.error("✗", n, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
