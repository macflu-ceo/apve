/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 고도몰 상품 이미지(제이프리모 파트너 시스템 S3) 및 자사 도메인 허용
      { protocol: "https", hostname: "jprimo-partners-system-bucket.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "viaelite.co.kr" },
      // 어드민 업로드(Vercel Blob) — 푸시 알림 이미지 자동 축소용
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
