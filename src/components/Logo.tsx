import Image from "next/image";

// 원본 로고: 932 x 120 (심볼+텍스트 콤보)
const RATIO = 932 / 120;

/**
 * 로고 이미지.
 * @param height  렌더링 높이(px). 폭은 비율대로 자동 계산.
 * @param light   어두운 배경용 — 흰 텍스트 버전(심볼은 블루 유지)
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
      src={light ? "/logo-light.png" : "/logo.png"}
      alt="돈버는명품샵"
      width={Math.round(height * RATIO)}
      height={height}
      priority
      unoptimized
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
