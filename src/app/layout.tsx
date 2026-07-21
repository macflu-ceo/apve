import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "돈버는 명품샵";
const DESCRIPTION =
  "코드 하나로 명품을 판매하는 어필리에이트 사이트. 재고 없이 명품 상품 링크를 발급해 판매하고 수익을 올리세요. 이탈리아 부티크 직수입 정품, 럭셔리 컨시어지 멤버십.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "돈버는 명품샵 | 명품 어필리에이트 판매 사이트",
    template: "%s | 돈버는 명품샵",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "어필리에이트 사이트",
    "명품 어필리에이트",
    "어필리에이트 마케팅",
    "명품 판매",
    "명품 부업",
    "명품 셀렉트샵",
    "럭셔리 컨시어지",
    "돈버는 명품샵",
    "명품 공동구매",
    "이탈리아 부티크",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "돈버는 명품샵 | 명품 어필리에이트 판매 사이트",
    description: DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "돈버는 명품샵 | 명품 어필리에이트 판매 사이트",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // 네이버 웹마스터/구글 서치콘솔 소유확인 코드가 발급되면 값만 채우세요.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.NAVER_SITE_VERIFICATION
      ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION }
      : undefined,
  },
};

// 루트는 껍데기만. 쇼핑몰 chrome은 (shop) 레이아웃, 백오피스 chrome은 admin 레이아웃이 담당.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
