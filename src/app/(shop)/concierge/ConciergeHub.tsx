import Link from "next/link";
import { conciergeCode } from "@/lib/concierge-access";

/** 컨시어지 전용 허브 — 매장 링크 생성기 · 상품카드 생성기 · 전용 공지 */
type Notice = { id: string; title: string; pinned: boolean; date: string };
export default function ConciergeHub({ name, conciergeNo, notices = [] }: { name: string; conciergeNo: number; notices?: Notice[] }) {
  const tools = [
    {
      href: "/me/multilink",
      emoji: "🔗",
      title: "내 멀티링크",
      desc: "내가 고른 상품을 한 페이지로 모아 공유하고, 고객 추천 신청을 받습니다.",
    },
    {
      href: "/concierge/coupons",
      emoji: "🎫",
      title: "매장 특별 이용 권한",
      desc: "청담점 방문 고객에게 전용가 권한을 발급하고, 사용·예약 현황을 관리합니다.",
    },
    {
      href: "/concierge/cards",
      emoji: "🖼️",
      title: "상품카드 생성기",
      desc: "복사한 상품으로 고객에게 보낼 카드 이미지를 즉시 만듭니다. (단일·리스트형)",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 rounded-xl2 bg-gradient-to-br from-[#2C3A30] to-[#222C25] p-6 text-white">
        <div className="text-xs font-semibold tracking-[0.2em] text-[#A9B8FF]">VIA ÉLITE · CONCIERGE</div>
        <div className="mt-2 text-xl font-bold">{name} 컨시어지</div>
        <div className="mt-0.5 text-sm text-white/70">
          컨시어지 번호 <b className="text-[#A9B8FF]">{conciergeCode(conciergeNo)}</b>
        </div>
      </div>

      {/* 공지 — 메인에서 바로 확인 (최대 5개) */}
      <div className="card mb-6 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold">📢 컨시어지 공지</h2>
          <Link href="/concierge/notices" className="text-xs font-semibold text-brand">공지 더보기 →</Link>
        </div>
        {notices.length === 0 ? (
          <div className="py-3 text-center text-sm text-sub">등록된 공지가 없습니다.</div>
        ) : (
          <ul className="divide-y divide-line">
            {notices.map((n) => (
              <li key={n.id}>
                <Link href={`/concierge/notices/${n.id}`} className="flex items-center gap-2 py-2.5 hover:bg-brandsoft/40">
                  {n.pinned && <span className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">고정</span>}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-xs text-sub">{n.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="card flex items-start gap-4 p-5 transition hover:bg-brandsoft">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl2 bg-brandsoft text-2xl">
              {t.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-ink">{t.title}</div>
              <p className="mt-0.5 text-sm text-ink/60">{t.desc}</p>
            </div>
            <span className="shrink-0 self-center text-xl text-ink/30">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
