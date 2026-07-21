/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 고도몰 상품 이미지(제이프리모 파트너 시스템 S3) 및 자사 도메인 허용
      { protocol: "https", hostname: "jprimo-partners-system-bucket.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "viaelite.co.kr" },
    ],
  },
};

export default nextConfig;
