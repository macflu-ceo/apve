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
    icon: "🛍️",
    title: "내 이름의 명품샵, 멀티링크",
    body: "상품을 골라 담아 「내 이름의 명품샵」을 만듭니다. 프로필·배너·진열까지 내 마음대로 꾸미고, 링크 하나로 어디서든 팝니다.",
    chips: ["공식 인증 뱃지", "veca.sh 짧은 주소", "기획전 배너"],
  },
  {
    icon: "💎",
    title: "같은 상품을 팔아도 더 남는 수수료",
    body: "일반 어필리에이터보다 높은 요율로 정산됩니다. 골든타임 부스트가 열리면 그 위에 추가 수수료가 얹힙니다.",
    chips: ["상위 요율", "골든타임 부스트", "월 정산"],
  },
  {
    icon: "🎟️",
    title: "컨시어지 전용 상품과 고객 쿠폰",
    body: "일반에 열리지 않는 물량을 먼저 받고, 내 고객에게만 쓸 수 있는 전용 쿠폰을 발급합니다. 단골을 만드는 무기가 됩니다.",
    chips: ["선공개 물량", "전용 쿠폰 발급"],
  },
  {
    icon: "📦",
    title: "재고 없이, 자본 없이",
    body: "미리 사둘 필요가 없습니다. 소싱·통관·물류·CS는 본사가 처리합니다. 컨시어지는 추천하고 파는 일에만 집중하면 됩니다.",
    chips: ["무재고", "본사 CS 처리", "정품 200% 보상"],
  },
  {
    icon: "🎨",
    title: "AI 화보와 세일즈 자료까지",
    body: "상품별 AI 착용샷, 상품 카드, 응대 스크립트를 그대로 가져다 씁니다. 콘텐츠 만드느라 시간 쓰지 않아도 됩니다.",
    chips: ["AI 착용샷", "카드뉴스", "응대 스크립트"],
  },
  {
    icon: "👥",
    title: "취향 등록으로 쌓이는 내 고객 DB",
    body: "내 샵에서 고객이 취향을 등록하면 나에게만 도착합니다. 사이즈·브랜드·예산을 알고 시작하는 판매는 성사율이 다릅니다.",
    chips: ["단골 DB", "맞춤 소싱 연결"],
  },
];

/** 신청 뒤 흐름 — 3단계면 충분하다 */
const STEPS = [
  { no: "1", title: "신청서 작성", body: "아래 버튼을 눌러 몇 가지 질문에 답합니다. 3분이면 충분합니다." },
  { no: "2", title: "본사 확인", body: "담당 MD가 확인 후 연락드립니다. 보통 1~2일 안에 끝납니다." },
  { no: "3", title: "샵 오픈", body: "승인 즉시 컨시어지 번호가 발급되고, 내 멀티링크 샵을 열 수 있습니다." },
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
    <div className="mx-auto max-w-2xl pb-10">
      {/* ── 히어로 ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#4A60FF] to-[#6E82FF] px-5 pb-12 pt-10 text-center text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-white/10" aria-hidden />
        <div className="text-[10px] font-bold tracking-[0.3em] text-white/70">VIA ÉLITE OFFICIAL CONCIERGE</div>
        <h1 className="mt-2 text-[26px] font-extrabold leading-snug">
          내 이름으로 명품을 파는
          <br />
          가장 빠른 길
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-[13.5px] leading-relaxed text-white/85">
          재고도, 자본금도 필요 없습니다.
          <br />
          공식 컨시어지가 되면 아래의 모든 것이 열립니다.
        </p>
        {grade && (
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[12px] font-bold backdrop-blur">
            현재 등급 <span className="text-white">{grade}</span>
            <span aria-hidden className="text-white/50">→</span>
            <span className="text-[#FFE9A8]">공식 컨시어지</span>
          </div>
        )}
      </div>

      <div className="px-4">
        {/* ── 무엇이 열리는지 ── */}
        <div className="-mt-6 space-y-3">
          {PERKS.map((t, i) => (
            <div key={t.title} className="rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(20,30,80,.08)] ring-1 ring-line/60">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brandsoft text-xl">{t.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black tabular-nums text-brand/40">{String(i + 1).padStart(2, "0")}</span>
                    <div className="text-[15.5px] font-extrabold leading-snug">{t.title}</div>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink/65">{t.body}</p>
                  {t.chips && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {t.chips.map((c) => (
                        <span key={c} className="rounded-full bg-brandsoft px-2.5 py-1 text-[10.5px] font-bold text-brand">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 진행 절차 ── */}
        <div className="mt-8">
          <div className="text-center text-lg font-extrabold">이렇게 진행됩니다</div>
          <div className="mt-4 space-y-0">
            {STEPS.map((s, i) => (
              <div key={s.no} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-white">
                    {s.no}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 bg-brand/20" aria-hidden />}
                </div>
                <div className={i < STEPS.length - 1 ? "pb-6" : ""}>
                  <div className="pt-1 text-[14.5px] font-bold">{s.title}</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/60">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 유지 조건 — 신청 전에 분명히 알려야 나중에 다투지 않는다 ── */}
        <div className="mt-8 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-amber-900">⚖️ 자격 유지 조건</div>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
            컨시어지는 <b>3개월마다 매출 200만원</b>을 채워야 유지됩니다. 기간 안에 못 채우면
            <b> 자동으로 일반 등급으로 돌아갑니다.</b> 자격이 풀려도 다시 신청할 수 있습니다.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-900/60">
            매출은 구매확정 기준이며, 남은 기간과 달성률은 컨시어지 화면에서 언제든 확인할 수 있습니다.
          </p>
        </div>

        {/* ── 신청 ── */}
        <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#4A60FF] to-[#5b70ff] p-6 text-center text-white shadow-[0_8px_28px_rgba(74,96,255,.35)]">
          <div className="text-lg font-extrabold">공식 컨시어지 신청하기</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">
            몇 가지만 확인한 뒤 승인해 드립니다.
            <br />
            승인되면 바로 내 샵을 열 수 있습니다.
          </p>
          <ApplyModal questions={questions} />
        </div>
      </div>
    </div>
  );
}
