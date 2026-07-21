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
        brand: "#8a6f5e", // 웜 브라운 (로고/포인트)
        brandsoft: "#f3ede7", // 베이지 배경
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
        shell: "1200px",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
