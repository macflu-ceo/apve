import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 퀸잇 톤: 화이트 배경 · 웜 브라운 포인트 · 할인율 틸
        ink: "#1a1a1a",
        sub: "#9a9a9a",
        line: "#f0f0f0",
        brand: "#4A60FF", // 브랜드 블루 (로고/포인트)
        brandsoft: "#EEF1FF", // 연블루 배경
        deal: "#13b6a6", // 할인율 틸
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "'Apple SD Gothic Neo'",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      maxWidth: {
        shell: "480px",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
