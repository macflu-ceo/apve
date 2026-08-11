import Link from "next/link";
import { conciergeCode } from "@/lib/concierge-access";

/** 컨시어지 전용 허브 — 매장 링크 생성기 · 상품카드 생성기 · 전용 공지 */
export default function ConciergeHub({ name, conciergeNo }: { name: string; conciergeNo: number }) {
  const tools = [
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
    {
      href: "/concierge/notices",
      emoji: "📢",
      title: "컨시어지 공지",
      desc: "본사 공지·자료를 확인합니다. 첨부파일 다운로드 지원.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 rounded-xl2 bg-gradient-to-br from-[#2C3A30] to-[#222C25] p-6 text-white">
        <div className="text-xs font-semibold tracking-[0.2em] text-[#DCC38A]">VIA ÉLITE · CONCIERGE</div>
        <div className="mt-2 text-xl font-bold">{name} 컨시어지</div>
        <div className="mt-0.5 text-sm text-white/70">
          컨시어지 번호 <b className="text-[#DCC38A]">{conciergeCode(conciergeNo)}</b>
        </div>
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
