import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// 링크 공유 시(카카오톡·네이버·SNS) 뜨는 미리보기 이미지
export const runtime = "nodejs";
export const alt = "돈버는 명품샵 — 코드 하나로 명품을 판매하고 수익을 올리세요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = readFileSync(join(process.cwd(), "src/app/_og/KR.ttf"));

export default function OG() {
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
          fontFamily: "KR",
        }}
      >
        {/* 상단 라틴 워드마크 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, letterSpacing: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#c9a875", display: "flex" }} />
          <div style={{ fontSize: 30, color: "#d9c3a5", fontWeight: 700 }}>CASH BOUTIQUE</div>
        </div>

        {/* 메인 타이틀 */}
        <div style={{ marginTop: 34, fontSize: 92, fontWeight: 700, lineHeight: 1.1 }}>돈버는 명품샵</div>

        {/* 태그라인 */}
        <div style={{ marginTop: 24, fontSize: 34, color: "#e3d6c5", lineHeight: 1.4 }}>
          코드 하나로 명품을 판매하고
        </div>
        <div style={{ fontSize: 34, color: "#e3d6c5", lineHeight: 1.4, display: "flex" }}>
          <span>수익을 올리세요</span>
          <span style={{ marginLeft: 14, color: "#c9a875" }}>· 럭셔리 어필리에이트</span>
        </div>

        {/* 하단 도메인 */}
        <div style={{ marginTop: 48, fontSize: 26, color: "#b6a48d", letterSpacing: 2 }}>cashboutique.co.kr</div>
      </div>
    ),
    { ...size, fonts: [{ name: "KR", data: font, weight: 700, style: "normal" }] }
  );
}
