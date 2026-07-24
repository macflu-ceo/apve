import Image from "next/image";

// 원본 로고: 132 x 22 (비율 6:1)
const RATIO = 132 / 22;

/**
 * 로고 이미지.
 * @param height  렌더링 높이(px). 폭은 비율대로 자동 계산.
 * @param light   어두운 배경용 — 검정 로고를 흰색으로 반전
 */
export default function Logo({
  height = 22,
  light = false,
  className = "",
}: {
  height?: number;
  light?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="돈버는명품샵"
      width={Math.round(height * RATIO)}
      height={height}
      priority
      unoptimized
      className={`${light ? "invert" : ""} ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
