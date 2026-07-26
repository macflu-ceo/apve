import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// 링크 공유 시(카카오톡·네이버·SNS) 뜨는 미리보기 이미지
export const runtime = "nodejs";
export const alt = "돈버는 명품샵 — 코드 하나로 명품을 판매하고 수익을 올리세요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 한글 폰트를 읽는다. 배포 환경에서 파일이 없으면 null (이미지는 그대로 렌더). */
function loadFont(): Buffer | null {
  for (const p of [
    join(process.cwd(), "src/app/_og/KR.ttf"),
    join(process.cwd(), ".next/server/app/_og/KR.ttf"),
    join(__dirname, "_og/KR.ttf"),
  ]) {
    try {
      return readFileSync(p);
    } catch {
      /* 다음 경로 시도 */
    }
  }
  return null;
}

export default function OG() {
  const font = loadFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #201b17 0%, #3a3129 55%, #5a4a3c 100%)",
          color: "#f3ede7",
          fontFamily: font ? "KR" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, letterSpacing: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#c9a875", display: "flex" }} />
          <div style={{ fontSize: 30, color: "#d9c3a5", fontWeight: 700 }}>CASH BOUTIQUE</div>
        </div>

        <div style={{ marginTop: 34, fontSize: 92, fontWeight: 700, lineHeight: 1.1 }}>돈버는 명품샵</div>

        <div style={{ marginTop: 24, fontSize: 34, color: "#e3d6c5", lineHeight: 1.4 }}>
          코드 하나로 명품을 판매하고
        </div>
        <div style={{ fontSize: 34, color: "#e3d6c5", lineHeight: 1.4, display: "flex" }}>
          <span>수익을 올리세요</span>
          <span style={{ marginLeft: 14, color: "#c9a875" }}>· 럭셔리 어필리에이트</span>
        </div>

        <div style={{ marginTop: 48, fontSize: 26, color: "#b6a48d", letterSpacing: 2 }}>cashboutique.co.kr</div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "KR", data: font, weight: 700 as const, style: "normal" as const }] : [],
    }
  );
}
