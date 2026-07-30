// 돈버는 명품샵 앱 아이콘 — "명품가방에서 돈이 넘치는" 심플 3D 컨셉
//   실행: npx tsx scripts/gen_app_icons2.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/app_icon";

const NO_TEXT = "No text, no letters, no numbers, no words, no watermark, no brand logo.";
const BASE = "A modern mobile app icon, perfectly square 1:1, SIMPLE and CLEAN 3D render style (soft studio lighting, smooth glossy plastic-like materials, gentle soft shadows, rounded shapes), a single centered subject with slight padding around it, smooth solid background, bold and minimal so it reads clearly at small sizes. Rounded-square app icon composition.";
const THEME = "A luxury designer handbag with shiny gold coins joyfully overflowing and spilling out of the open top in an abundant pile, conveying 'making money'. Cheerful, premium, playful.";

const ICONS = [
  { name: "3d_1_coins_cream", prompt: `${BASE} ${THEME} Warm cream and beige background, gold coins, elegant tan/brown handbag. ${NO_TEXT}` },
  { name: "3d_2_coins_brown", prompt: `${BASE} ${THEME} Rich warm brown gradient background, bright gold coins, a classic quilted luxury handbag. High contrast, glossy. ${NO_TEXT}` },
  { name: "3d_3_coins_cash", prompt: `${BASE} A luxury designer handbag overflowing with both gold coins and neatly rolled bundles of cash spilling out of the top, abundant and playful. Warm cream and gold palette, simple clean 3D render. ${NO_TEXT}` },
  { name: "3d_4_coins_black_bag", prompt: `${BASE} ${THEME} A sleek black luxury handbag with gold hardware, gold coins overflowing, soft warm beige background, glossy premium 3D look. ${NO_TEXT}` },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function genOnce(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY as string },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
  if (!img) throw new Error("이미지 없음: " + JSON.stringify(data).slice(0, 200));
  return { b64: img.inlineData.data as string, mime: (img.inlineData.mimeType as string) || "image/png" };
}

// 과부하 대비: 최대 6회 재시도(백오프)
async function gen(prompt: string) {
  let lastErr: unknown;
  for (let i = 0; i < 6; i++) {
    try { return await genOnce(prompt); }
    catch (e) { lastErr = e; await sleep(6000 * (i + 1)); }
  }
  throw lastErr;
}

async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const c of ICONS) {
    try {
      const { b64, mime } = await gen(c.prompt);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      const file = `${OUT}/${c.name}.${ext}`;
      writeFileSync(file, Buffer.from(b64, "base64"));
      console.log("✓ 생성:", file);
    } catch (e) {
      console.error("✗ 실패:", c.name, "—", e instanceof Error ? e.message : e);
    }
    await sleep(2500); // 이미지 간 간격
  }
}
main();
