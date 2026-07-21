// AI 착용샷 생성 어댑터
// 상품 이미지가 한정적이므로, 원본 상품 이미지를 바탕으로 착용샷을 생성한다.
// 서비스는 환경변수 AI_PROVIDER로 스위치 (mock | openai | gemini | fal | replicate).
//
// ⚠️ 서비스 확정 후 각 provider 구현을 채운다. 지금은 mock이 원본 이미지를 반환.

export interface TryOnRequest {
  productImageUrl: string;   // 원본 상품 이미지
  productName: string;
  /** 착용 시나리오 프롬프트 (예: "여성 모델, 스튜디오, 전신") */
  prompt?: string;
}

export interface TryOnResult {
  imageUrl: string;
  provider: string;
  prompt: string;
}

const DEFAULT_PROMPT =
  "럭셔리 룩북 스타일의 자연스러운 착용샷, 깔끔한 스튜디오 배경, 전신, 고해상도";

export async function generateTryOn(req: TryOnRequest): Promise<TryOnResult> {
  const provider = process.env.AI_PROVIDER ?? "mock";
  const prompt = req.prompt ?? DEFAULT_PROMPT;

  switch (provider) {
    case "mock":
      // 서비스 연결 전: 원본 이미지를 그대로 반환 (UI/플로우 확인용)
      return { imageUrl: req.productImageUrl, provider: "mock", prompt };

    // case "openai":  return callOpenAI(req, prompt);
    // case "gemini":  return callGemini(req, prompt);
    // case "fal":     return callFal(req, prompt);
    // case "replicate": return callReplicate(req, prompt);

    default:
      throw new Error(`미구현 AI provider: ${provider} (AI_PROVIDER 확인)`);
  }
}
