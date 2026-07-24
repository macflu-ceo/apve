// AI 상품 이미지 생성 (Google Gemini 이미지 모델)
// ⚠️ 프롬프트(스크립트)는 서버에서만 조립되며 프론트로 내려가지 않는다.
//    클라이언트는 옵션(성별/연령/배경/컷)만 전달한다.

export type ShotOptions = {
  gender?: string;   // 남성 | 여성
  age?: string;      // 20대 | 30대 | 40대 | 50대
  background?: string; // 스튜디오(화이트) | 거리 | 카페 | 호텔 로비 | 야외
  shot?: string;     // 제품 클로즈업 | 모델 착용컷(전신) | 모델 착용컷(상반신)
};

/** 선택지 (프론트 버튼과 동일 — 값만 주고받음) */
export const SHOT_CHOICES = {
  gender: ["남성", "여성"],
  age: ["20대", "30대", "40대", "50대"],
  background: ["스튜디오(화이트)", "거리", "카페", "호텔 로비", "야외"],
  shot: ["제품 클로즈업", "모델 착용컷(전신)", "모델 착용컷(상반신)"],
} as const;

const BG_EN: Record<string, string> = {
  "스튜디오(화이트)": "a clean white seamless photography studio with soft diffused lighting",
  "거리": "an upscale city street with tasteful bokeh in the background",
  "카페": "a warm, stylish cafe interior with natural window light",
  "호텔 로비": "an elegant luxury hotel lobby with warm ambient lighting",
  "야외": "a bright outdoor setting with natural daylight",
};

const SHOT_EN: Record<string, string> = {
  "제품 클로즈업": "a tight product close-up that highlights the material, texture and stitching details of the item. Do not include any person.",
  "모델 착용컷(전신)": "a full-body fashion lookbook photo of a model wearing/holding the item, head to toe in frame",
  "모델 착용컷(상반신)": "an upper-body fashion photo of a model wearing/holding the item, from the waist up",
};

/** 서버 전용 프롬프트 빌더 (외부로 반환하지 않음) */
function buildPrompt(productName: string, brand: string | null, o: ShotOptions): string {
  const isCloseUp = o.shot === "제품 클로즈업";
  const subject = isCloseUp
    ? "Do not include any person or model."
    : `The model is a Korean ${o.gender === "여성" ? "female" : "male"} in their ${(o.age ?? "30대").replace("대", "")}s, natural and elegant looking.`;

  return [
    `Create a premium fashion e-commerce photograph of this exact product: "${productName}"${brand ? ` by ${brand}` : ""}.`,
    `Composition: ${SHOT_EN[o.shot ?? "모델 착용컷(전신)"] ?? SHOT_EN["모델 착용컷(전신)"]}`,
    subject,
    `Setting: ${BG_EN[o.background ?? "스튜디오(화이트)"] ?? BG_EN["스튜디오(화이트)"]}.`,
    "Style: high-end luxury brand campaign photography, sharp focus on the product, realistic fabric texture, professional color grading, photorealistic, 4k quality.",
    "Critical: keep the product's exact shape, color, pattern, logo and design identical to the reference image. Do not alter, restyle or invent product details.",
    "Do not add any text, watermark, logo overlay or graphic element to the image.",
  ].join(" ");
}

export type GenResult = { ok: true; base64: string; mime: string } | { ok: false; message: string };

/** 참조 이미지 + 옵션으로 새 이미지 생성 */
export async function generateProductImage(
  referenceImageUrl: string,
  productName: string,
  brand: string | null,
  options: ShotOptions
): Promise<GenResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, message: "AI 이미지 기능이 아직 설정되지 않았습니다. (관리자 문의)" };

  // 1) 원본 상품 이미지를 base64로
  let refB64 = "";
  let refMime = "image/jpeg";
  try {
    const r = await fetch(referenceImageUrl);
    if (!r.ok) throw new Error(`이미지 로드 실패 (${r.status})`);
    refMime = r.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    refB64 = Buffer.from(await r.arrayBuffer()).toString("base64");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "원본 이미지를 불러오지 못했습니다." };
  }

  // 2) Gemini 이미지 생성 호출
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: refMime, data: refB64 } },
              { text: buildPrompt(productName, brand, options) },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message ?? `생성 실패 (${res.status})`;
      return { ok: false, message: msg };
    }

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
    if (!img) return { ok: false, message: "이미지가 생성되지 않았습니다. 옵션을 바꿔 다시 시도해주세요." };

    return { ok: true, base64: img.inlineData.data, mime: img.inlineData.mimeType || "image/png" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "AI 생성 중 오류가 발생했습니다." };
  }
}
