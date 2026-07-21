import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

const ADMIN_MENU = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "상품 등록/관리" },
  { href: "/admin/banners", label: "배너 관리" },
  { href: "/admin/categories", label: "카테고리 관리" },
  { href: "/admin/sections", label: "홈 진열(섹션)" },
  { href: "/admin/exhibitions", label: "기획전 관리" },
  { href: "/admin/posts", label: "공지/가이드(게시판)" },
  { href: "/admin/partners", label: "회원(파트너) 관리" },
  { href: "/admin/sales", label: "판매내역" },
  { href: "/admin/settings", label: "계정정보/설정" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 로그인 안 된 경우 로그인 페이지로
  if (!isAdmin()) redirect("/admin-login");

  return (
    <div className="min-h-screen bg-[#f7f6f4]">
      {/* 백오피스 전용 헤더 (쇼핑몰과 분리) */}
      <header className="sticky top-0 z-40 bg-ink text-white">
        <div className="mx-auto flex max-w-shell items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black">돈버는명품샵</span>
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

      <div className="mx-auto grid max-w-shell gap-8 px-4 py-6 md:grid-cols-[200px_1fr]">
        <aside>
          <nav className="flex flex-col gap-1">
            {ADMIN_MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-white hover:text-ink"
              >
                {m.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="rounded-xl2 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
