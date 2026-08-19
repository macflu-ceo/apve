import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Tracker from "@/components/Tracker";
import { getSiteSetting } from "@/lib/settings";
import "./globals.css";

function safeSiteUrl(): string {
  let s = (process.env.SITE_URL ?? "").trim();
  if (!s) return "https://cashboutique.co.kr";
  if (!/^https?:\/\//.test(s)) s = "https://" + s;
  try {
    return new URL(s).origin;
  } catch {
    return "https://cashboutique.co.kr";
  }
}

const SITE_URL = safeSiteUrl();
const SITE_NAME = "돈버는 명품샵";
const TITLE = "돈버는 명품샵 | 명품 어필리에이트 판매 사이트";
const DESCRIPTION =
  "코드 하나로 명품을 판매하는 어필리에이트 사이트. 재고 없이 명품 상품 링크를 발급해 판매하고 수익을 올리세요. 이탈리아 부티크 직수입 정품, 럭셔리 컨시어지 멤버십.";

// 앱(웹뷰) 노치·다이나믹아일랜드 대응 — 안전영역 인셋 활성화
// maximumScale/userScalable: iOS 웹뷰에서 핀치줌으로 화면이 확대·고정되는 문제 방지(앱처럼 줌 잠금)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  // 어드민에서 등록한 링크 미리보기(OG) 이미지 (없으면 이미지 없이)
  let ogImage: string | null = null;
  try {
    const s = await getSiteSetting();
    ogImage = s.ogImage || null;
  } catch {
    ogImage = null;
  }
  const images = ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: TITLE, template: "%s | 돈버는 명품샵" },
    description: DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      "어필리에이트 사이트", "명품 어필리에이트", "어필리에이트 마케팅", "명품 판매",
      "명품 부업", "명품 셀렉트샵", "럭셔리 컨시어지", "돈버는 명품샵", "명품 공동구매", "이탈리아 부티크",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      title: TITLE,
      description: DESCRIPTION,
      locale: "ko_KR",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: process.env.NAVER_SITE_VERIFICATION
        ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION }
        : undefined,
    },
  };
}

// 루트는 껍데기만. 쇼핑몰 chrome은 (shop) 레이아웃, 백오피스 chrome은 admin 레이아웃이 담당.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Tracker />
        <Analytics />
      </body>
    </html>
  );
}
