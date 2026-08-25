// 앱 아이콘 단순화판: 주제가 프레임 꽉 채움 + 단순 + 대비 극대화
import "./loadenv";
import { writeFileSync, mkdirSync } from "node:fs";
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OUT = "/Users/leegeungjeong/lgj-aiagent/docs/appicon";
const BASE = "A bold mobile APP ICON. FULL SQUARE, edge to edge — the flat solid background color fills the ENTIRE square. NO rounded corners, NO frame, NO border. The SUBJECT is LARGE and FILLS most of the frame (tightly composed, very little empty margin around it). SIMPLE, minimal and iconic: clean bold rounded shapes, few elements, low detail. MAXIMUM contrast between the subject and the vivid flat background. Cute soft matte 3D. No text, no letters, no numbers.";
const CHAR = "the cute chubby beige blob mascot (big round eyes with white eyeballs + dark pupils + shine, happy open smile, little arms)";
const VARIANTS = [
  { name: "s_pop_coral", bg: "solid vivid CORAL RED", subj: `${CHAR} popping BIG out of a SIMPLE solid black luxury handbag (minimal detail), with just 3-4 gold coins spilling` },
  { name: "s_pop_teal", bg: "solid vivid TEAL green", subj: `${CHAR} popping BIG out of a SIMPLE solid black luxury handbag (minimal detail), with just 3-4 gold coins spilling` },
  { name: "s_hug_coral", bg: "solid vivid CORAL RED", subj: `${CHAR} filling the frame, happily holding a small simple black luxury handbag with one big shiny gold coin` },
  { name: "s_hug_teal", bg: "solid vivid TEAL green", subj: `${CHAR} filling the frame, happily holding a small simple black luxury handbag with one big shiny gold coin` },
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
  for (const v of VARIANTS) {
    try { const { b64, mime } = await gen(`${BASE} Background: ${v.bg} (single flat color). Subject: ${v.subj}.`); const ext = mime.includes("jpeg") ? "jpg" : "png";
      writeFileSync(`${OUT}/${v.name}.${ext}`, Buffer.from(b64, "base64")); console.log("✓", v.name);
    } catch (e) { console.error("✗", v.name, e instanceof Error ? e.message : e); }
    await sleep(2500);
  }
}
main();
