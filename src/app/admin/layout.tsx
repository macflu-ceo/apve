import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import Logo from "@/components/Logo";
import AdminTopNav from "./AdminTopNav";
import AdminSideNav from "./AdminSideNav";

const ADMIN_GROUPS = [
  {
    group: "현황",
    items: [
      { href: "/admin", label: "대시보드" },
      { href: "/admin/analytics", label: "애널리틱스" },
    ],
  },
  {
    group: "상품",
    items: [
      { href: "/admin/catalog", label: "고도몰 상품 픽" },
      { href: "/admin/products", label: "상품 등록/관리" },
      { href: "/admin/ai-images", label: "AI 생성 이미지" },
    ],
  },
  {
    group: "홈 편성",
    items: [
      { href: "/admin/banners", label: "배너 관리" },
      { href: "/admin/popups", label: "팝업 관리" },
      { href: "/admin/categories", label: "메인 원형 아이콘" },
      { href: "/admin/sections", label: "홈 진열(섹션)" },
      { href: "/admin/exhibitions", label: "기획전 관리" },
      { href: "/admin/timesale", label: "골든타임(수수료부스트)" },
      { href: "/admin/onboarding", label: "첫 실행 온보딩" },
    ],
  },
  {
    group: "마케팅·알림",
    items: [
      { href: "/admin/crm", label: "CRM(메시지 발송)" },
      { href: "/admin/push", label: "앱 푸시" },
      { href: "/admin/community", label: "커뮤니티 관리" },
      { href: "/admin/community-reports", label: "커뮤니티 신고·처리" },
      { href: "/admin/rewards", label: "리뷰·홍보 인증(보상)" },
      { href: "/admin/posts", label: "공지/가이드(게시판)" },
    ],
  },
  {
    group: "회원·정산",
    items: [
      { href: "/admin/partners", label: "회원(파트너) 관리" },
      { href: "/admin/grades", label: "등급/수수료율" },
      { href: "/admin/sales", label: "판매내역" },
      { href: "/admin/settlements", label: "정산" },
    ],
  },
  {
    group: "컨시어지",
    items: [
      { href: "/admin/concierge", label: "컨시어지 신청" },
      { href: "/admin/concierge-members", label: "컨시어지 임명" },
      { href: "/admin/concierge-notices", label: "전용 공지" },
      { href: "/admin/concierge-stores", label: "매장 관리" },
      { href: "/admin/concierge-coupons", label: "쿠폰·집계" },
      { href: "/admin/concierge-reservations", label: "방문 예약" },
      { href: "/admin/recommend-leads", label: "멀티링크 추천신청" },
    ],
  },
  {
    group: "설정",
    items: [{ href: "/admin/settings", label: "계정정보/설정" }],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 로그인 안 된 경우 로그인 페이지로
  if (!isAdmin()) redirect("/admin-login");

  return (
    <div className="min-h-screen bg-[#f7f6f4]">
      {/* 헤더 + 가로 메뉴바를 한 덩어리로 상단 고정 (오프셋 계산 불필요) */}
      <div className="sticky top-0 z-40">
        {/* 백오피스 전용 헤더 (쇼핑몰과 분리) */}
        <header className="bg-ink text-white">
          <div className="mx-auto flex max-w-shell items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Logo height={18} light />
              <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-bold">ADMIN</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs text-white/70 hover:text-white" target="_blank">
                쇼핑몰 보기 ↗
              </Link>
              <a href="/admin-login/logout" className="text-xs text-white/70 hover:text-white">
                로그아웃
              </a>
            </div>
          </div>
        </header>

        {/* 상단 대분류(그룹) 바 */}
        <div className="border-b border-line bg-[#f7f6f4]/95 backdrop-blur">
          <div className="mx-auto max-w-shell px-4 py-2">
            <AdminTopNav groups={ADMIN_GROUPS} />
          </div>
        </div>
      </div>

      {/* 좌측: 선택 그룹의 하위 메뉴 / 우측: 콘텐츠 */}
      <div className="mx-auto grid max-w-shell gap-6 px-4 py-6 md:grid-cols-[180px_1fr]">
        <aside>
          <AdminSideNav groups={ADMIN_GROUPS} />
        </aside>
        {/* min-w-0: 넓은 테이블이 페이지 전체를 밀지 않고 테이블 내부에서만 가로 스크롤되게 */}
        <div className="min-w-0 rounded-xl2 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
