import { getCurrentPartner } from "@/lib/session";
import { listActiveQuestions } from "@/lib/concierge";
import { getConciergeViewer } from "@/lib/concierge-access";
import { parseList } from "@/lib/format";
import ApplyModal from "./ApplyModal";
import ConciergeHub from "./ConciergeHub";

export const dynamic = "force-dynamic";

const TIERS = [
  { name: "어필리에이터", desc: "회원가입 후 승인되면 활동. 상품 링크를 발급해 판매하고 수수료를 받습니다.", active: true },
  { name: "컨시어지", desc: "정품 명품을 오프라인·네트워크로 판매하는 럭셔리 컨시어지. 더 높은 혜택과 지원.", active: false },
];

export default async function ConciergePage() {
  // 컨시어지 자격이면 전용 허브(도구 3종)로, 아니면 아래 가입 랜딩으로
  const concierge = await getConciergeViewer();
  if (concierge) return <ConciergeHub name={concierge.name} conciergeNo={concierge.conciergeNo} />;

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
      <h1 className="mb-1 text-2xl font-bold">멤버십 업그레이드</h1>
      <p className="mb-6 text-sm text-ink/60">The Gateway to Global Luxury Distribution</p>

      {grade && (
        <div className="mb-5 rounded-xl2 bg-brandsoft p-4 text-sm">
          현재 등급: <b className="text-brand">{grade}</b>
        </div>
      )}

      {/* 등급 안내 */}
      <div className="mb-6 space-y-3">
        {TIERS.map((t) => (
          <div key={t.name} className="card p-5">
            <div className="flex items-center gap-2">
              <span className="text-base font-black">{t.name}</span>
              {grade === t.name && <span className="rounded-full bg-deal/15 px-2 py-0.5 text-xs font-bold text-deal">현재</span>}
            </div>
            <p className="mt-1 text-sm text-ink/70">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* 컨시어지 가입 CTA */}
      <div className="card p-6">
        <div className="text-lg font-bold">컨시어지 가입하기</div>
        <p className="mt-1 text-sm text-ink/70">
          무재고·소자본으로 시작하는 럭셔리 판매. 소싱·물류 전 과정을 본사가 처리하고, 세일즈 자료와 교육을 지원합니다.
        </p>
        <ApplyModal questions={questions} />
      </div>
    </div>
  );
}
