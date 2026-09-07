import { getCurrentPartner } from "@/lib/session";
import { prisma } from "@/lib/db";
import { listActiveQuestions } from "@/lib/concierge";
import { getConciergeViewer } from "@/lib/concierge-access";
import { conciergeTerm, TERM_TARGET } from "@/lib/concierge-term";
import { parseList } from "@/lib/format";
import ApplyModal from "./ApplyModal";
import ConciergeHub from "./ConciergeHub";

export const dynamic = "force-dynamic";

/** 컨시어지가 되면 무엇이 열리는지 — 신청 전에 이것부터 읽힌다 */
const PERKS = [
  {
    title: "내 이름으로 파는 멀티링크",
    body: "상품을 골라 담아 나만의 셀렉션을 만들고, 링크 하나로 팝니다. 공식 컨시어지 뱃지가 붙습니다.",
  },
  {
    title: "높은 수수료율",
    body: "일반 어필리에이터보다 높은 요율로 정산됩니다. 같은 상품을 팔아도 더 남습니다.",
  },
  {
    title: "컨시어지 전용 상품·쿠폰",
    body: "일반에 열리지 않는 상품과 고객 전용 쿠폰을 발급할 수 있습니다.",
  },
  {
    title: "무재고·소자본",
    body: "미리 사둘 필요가 없습니다. 소싱·물류·CS는 본사가 처리하고, 파는 일에만 집중합니다.",
  },
  {
    title: "세일즈 자료와 교육",
    body: "상품 카드, 상세 소개, 응대 스크립트를 그대로 씁니다. 신규 회차마다 갱신됩니다.",
  },
];

export default async function ConciergePage() {
  // 컨시어지 자격이면 전용 허브(도구 3종)로, 아니면 아래 가입 랜딩으로
  const concierge = await getConciergeViewer();
  if (concierge) {
    const notices = await prisma.conciergeNotice.findMany({
      where: { published: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, pinned: true, createdAt: true },
    });
    const me = await prisma.partner.findUnique({
      where: { id: concierge.id },
      select: { conciergeStartedAt: true },
    });
    const t = await conciergeTerm(concierge.id, me?.conciergeStartedAt ?? null);
    return (
      <ConciergeHub
        name={concierge.name}
        conciergeNo={concierge.conciergeNo}
        term={{ daysLeft: t.daysLeft, sales: t.sales, rate: t.rate, target: TERM_TARGET }}
        notices={notices.map((n) => ({
          id: n.id,
          title: n.title,
          pinned: n.pinned,
          date: n.createdAt.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
        }))}
      />
    );
  }

  const partner = await getCurrentPartner();
  const questions = (await listActiveQuestions()).map((q) => ({
    id: q.id,
    label: q.label,
    type: q.type,
    options: parseList(q.optionsJson),
    required: q.required,
  }));
  const grade = !partner ? null : partner.status === "approved" ? "어필리에이터" : "승인대기중";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">공식 컨시어지 신청</h1>
      <p className="mb-6 text-sm text-ink/60">내 이름으로 명품을 파는 가장 빠른 길</p>

      {grade && (
        <div className="mb-5 rounded-xl2 bg-brandsoft p-4 text-sm">
          현재 등급: <b className="text-brand">{grade}</b>
        </div>
      )}

      {/* 무엇이 열리는지 먼저 */}
      <div className="mb-6 space-y-3">
        {PERKS.map((t, i) => (
          <div key={t.title} className="card flex gap-3 p-5">
            <span className="mt-0.5 shrink-0 text-xs font-black tabular-nums text-brand/50">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="text-base font-bold">{t.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{t.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 유지 조건 — 신청 전에 분명히 알려야 나중에 다투지 않는다 */}
      <div className="mb-6 rounded-xl2 border-2 border-amber-400/60 bg-amber-50 p-5">
        <div className="text-base font-bold text-amber-900">자격 유지 조건</div>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
          컨시어지는 <b>3개월마다 매출 200만원</b>을 채워야 유지됩니다. 기간 안에 못 채우면
          <b> 자동으로 일반 등급으로 돌아갑니다.</b> 자격이 풀려도 다시 신청할 수 있습니다.
        </p>
        <p className="mt-2 text-xs text-amber-900/60">
          매출은 구매확정 기준이며, 남은 기간과 달성률은 컨시어지 화면에서 언제든 확인할 수 있습니다.
        </p>
      </div>

      <div className="card p-6">
        <div className="text-lg font-bold">신청하기</div>
        <p className="mt-1 text-sm text-ink/70">
          몇 가지만 확인한 뒤 승인해 드립니다. 승인되면 바로 셀렉션을 만들 수 있습니다.
        </p>
        <ApplyModal questions={questions} />
      </div>
    </div>
  );
}
