// 배경 PNG + 또렷한 한글 텍스트(SVG) 합성 → public/banners/review_app.svg
//   실행: npx tsx scripts/compose_review_banner.ts
import { readFileSync, writeFileSync } from "node:fs";

const BG = "/Users/leegeungjeong/lgj-aiagent/docs/banners/review_bg_1.png";
const OUT = "/Users/leegeungjeong/luxury-affiliate-platform/public/banners/review_app.svg";

const b64 = readFileSync(BG).toString("base64");
const FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic','Pretendard','Nanum Gothic',sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.95"/>
    </filter>
  </defs>
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="1024" height="1024" preserveAspectRatio="xMidYMid slice"/>
  <g font-family="${FONT}" text-anchor="middle" filter="url(#soft)">
    <text x="512" y="118" font-size="48" font-weight="800" fill="#4a3526" letter-spacing="1">앱 설치하고 리뷰 쓰면</text>
    <text x="512" y="212" font-size="98" font-weight="900" fill="#df5b39">수수료 20%</text>
  </g>
</svg>`;

writeFileSync(OUT, svg);
console.log("생성:", OUT, `(${Math.round(svg.length / 1024)} KB)`);
