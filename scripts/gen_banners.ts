// 메인 배너 이미지 생성 (Gemini 텍스트→이미지) — 플랫폼의 GEMINI_API_KEY 재사용
//   실행: npx tsx scripts/gen_banners.ts
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/banners";

const NO_TEXT = "Absolutely no text, no letters, no numbers, no words, no watermark, no logo overlay in the image.";
const BASE = "A friendly, warm and eye-catching wide 16:9 banner image for a luxury shopping app homepage. Bright, inviting and approachable (NOT cold, dark or overly austere). Vibrant but tasteful colors, cheerful mood, photorealistic, clear focal point.";
// 글자는 배너 하단에 깔리므로, 이미지 여백도 '아래쪽'에 두게 지시
const BOTTOM_SPACE = "Composition: keep the main subject in the UPPER TWO-THIRDS of the frame; leave the BOTTOM THIRD as a clean, simple, uncluttered smooth area for text overlay. Do NOT put empty space on the left or right sides.";

const BANNERS = [
  { name: "1_boutique_신뢰", prompt: `${BASE} A cheerful young Korean woman with a natural happy smile joyfully discovering designer handbags in a bright, welcoming Italian-style boutique with warm colorful lighting. Conveys the fun and joy of authentic luxury shopping. Approachable and modern. ${BOTTOM_SPACE} ${NO_TEXT}` },
  { name: "2_event_첫판매20", prompt: `${BASE} A happy, excited young Korean person smiling brightly while looking at their smartphone, with playful floating golden coins and a small gift box around them suggesting a cash reward, a stylish designer handbag beside them, cheerful warm colors (cream, coral, gold), celebratory upbeat mood. Clearly conveys earning money easily by sharing. ${BOTTOM_SPACE} ${NO_TEXT}` },
  { name: "3_timesale_긴박", prompt: `${BASE} An energetic, upbeat scene for a limited-time commission boost: a bright cheerful alarm clock or stopwatch with dynamic upward arrows and sparkles suggesting a rising boost, a stylish designer handbag nearby, vibrant warm colors (coral, gold, warm red), exciting 'now is the time' energy that feels fun and friendly, not scary. ${BOTTOM_SPACE} ${NO_TEXT}` },
  { name: "4_onboarding", prompt: `${BASE} A friendly, relatable young Korean person cheerfully holding a smartphone that shows a simple share button, in a bright airy modern room with warm inviting colors, easygoing approachable mood, a subtle stylish handbag in the frame. Clearly conveys 'anyone can start easily and quickly'. ${BOTTOM_SPACE} ${NO_TEXT}` },
];

async function gen(prompt: string) {
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

async function main() {
  if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  for (const b of BANNERS) {
    try {
      const { b64, mime } = await gen(b.prompt);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      const file = `${OUT}/${b.name}.${ext}`;
      writeFileSync(file, Buffer.from(b64, "base64"));
      console.log("✓ 생성:", file);
    } catch (e) {
      console.error("✗ 실패:", b.name, "—", e instanceof Error ? e.message : e);
    }
  }
}
main();
