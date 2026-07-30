import Link from "next/link";
import { getSiteSetting } from "@/lib/settings";
import { getSessionPartner } from "@/lib/auth";
import AuthModalProvider from "@/components/auth/AuthModalProvider";
import AuthNav from "@/components/auth/AuthNav";
import Logo from "@/components/Logo";
import { ShopNav, ShopNavMobile } from "@/components/ShopNav";
import { getPartnerGrade } from "@/lib/grade";
import { getCompany } from "@/lib/company";
import { getTimeSaleForShop } from "@/lib/timesale";
import TimeSaleBanner from "@/components/TimeSaleBanner";
import { getActivePopups } from "@/lib/popup";
import PopupLayer from "@/components/PopupLayer";
import AppInstallBar from "@/components/AppInstallBar";
import { getPlatform } from "@/lib/platform";

const BASE_TABS = [
  { href: "/", label: "추천상품" },
  { href: "/board?category=공지", label: "공지" },
  { href: "/board?category=가이드", label: "가이드" },
];
const UPGRADE_TAB = { href: "/concierge", label: "멤버십 업그레이드" };

function TopIcon({ path, label, href }: { path: string; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 text-[11px] text-ink/70">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

function BottomTab({ path, label, href }: { path: string; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-ink/70">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [setting, partner, timeSale, COMPANY, popups] = await Promise.all([
    getSiteSetting(),
    getSessionPartner(),
    getTimeSaleForShop(),
    getCompany(),
    getActivePopups(),
  ]);

  const platform = getPlatform(); // web | app (앱 웹뷰면 다운로드 유도 숨김)

  // 이미 상위 등급(컨시어지 등 = systemKey 없는 커스텀 등급)이면 업그레이드 메뉴를 감춘다
  const grade = partner ? await getPartnerGrade(partner.id) : null;
  const upgraded = !!grade && grade.systemKey == null;
  const tabs = upgraded ? BASE_TABS : [...BASE_TABS, UPGRADE_TAB];

  return (
    <AuthModalProvider>
      {popups.length > 0 && <PopupLayer popups={popups} />}
      {platform === "web" && (
        <AppInstallBar ios={setting.appIosUrl} android={setting.appAndroidUrl} landing={setting.appLandingUrl} />
      )}
      {timeSale && timeSale.state !== "off" && (
        <TimeSaleBanner
          title={timeSale.ts.title}
          state={timeSale.state}
          upcomingText={timeSale.ts.upcomingText}
          liveText={timeSale.ts.liveText}
          startAt={timeSale.ts.startAt?.toISOString() ?? null}
          endAt={timeSale.ts.endAt?.toISOString() ?? null}
          maxBoost={timeSale.maxBoost}
          colorFrom={timeSale.ts.colorFrom}
          colorTo={timeSale.ts.colorTo}
        />
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex max-w-shell items-center gap-6 px-4 py-3">
          <Link href="/" className="shrink-0" aria-label={setting.siteName}>
            <Logo height={22} />
          </Link>

          <ShopNav tabs={tabs} />

          <div className="ml-auto flex items-center gap-4">
            <TopIcon href="/category" label="상품필터" path="M3 5h18M6 10h12M10 15h4" />
            <AuthNav name={partner?.name ?? null} />
          </div>
        </div>

        {/* 탭 (모바일/태블릿) */}
        <ShopNavMobile tabs={tabs} />
      </header>

      <main className="mx-auto max-w-shell pb-24 md:pb-0">{children}</main>

      {/* 하단 탭바 (모바일 전용) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden">
        <div className="mx-auto grid max-w-shell grid-cols-4">
          <BottomTab href="/" label="홈" path="M3 11l9-8 9 8M5 10v10h14V10" />
          <BottomTab href="/category" label="카테고리" path="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
          <BottomTab href="/me" label="찜" path="M12 21s-7-4.5-9.5-8.5A5 5 0 0112 6a5 5 0 019.5 6.5C19 16.5 12 21 12 21z" />
          <BottomTab href="/me" label="내정보" path="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
        </div>
      </nav>

      <footer className="mt-16 border-t border-line bg-[#faf9f8] pb-24 md:pb-0">
        <div className="mx-auto max-w-shell px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            {/* 브랜드 */}
            <div>
              <Logo height={20} />
              <p className="mt-3 text-xs leading-relaxed text-sub">
                이탈리아 부티크 직계약 정품 명품을
                <br />
                코드 하나로 판매하는 어필리에이트 플랫폼
              </p>
            </div>

            {/* 바로가기 */}
            <div>
              <div className="mb-2 text-sm font-bold">바로가기</div>
              <ul className="space-y-1.5 text-xs text-sub">
                <li><Link href="/" className="hover:text-ink">추천상품</Link></li>
                <li><Link href="/board?category=공지" className="hover:text-ink">공지사항</Link></li>
                <li><Link href="/board?category=가이드" className="hover:text-ink">이용 가이드</Link></li>
                {!upgraded && (
                  <li><Link href="/concierge" className="hover:text-ink">멤버십 업그레이드</Link></li>
                )}
                <li><Link href="/me" className="hover:text-ink">내정보</Link></li>
                <li><Link href="/terms?doc=service" className="hover:text-ink">이용약관</Link></li>
                <li><Link href="/terms?doc=privacy_policy" className="font-semibold hover:text-ink">개인정보처리방침</Link></li>
                <li><Link href="/terms?doc=refund_policy" className="hover:text-ink">취소·환불 정책</Link></li>
              </ul>
            </div>

            {/* 사업자 정보 */}
            <div>
              <div className="mb-2 text-sm font-bold">사업자 정보</div>
              <ul className="space-y-1 text-xs leading-relaxed text-sub">
                <li>{COMPANY.corpName} · 대표 {COMPANY.ceo}</li>
                <li>사업자등록번호 {COMPANY.bizNo}</li>
                <li>통신판매업 신고번호 {COMPANY.mailOrderNo}</li>
                <li>{COMPANY.address}</li>
                <li>개인정보 보호책임자 {COMPANY.privacyOfficer} ({COMPANY.privacyEmail})</li>
                <li>고객센터 {COMPANY.csPhone} · {COMPANY.email}</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-4 text-[11px] text-sub">
            © {new Date().getFullYear()} {COMPANY.corpName}. All rights reserved.
          </div>
        </div>
      </footer>
    </AuthModalProvider>
  );
}
