import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { ensureDefaultQuestions } from "@/lib/concierge";
import { ApplicationRow, QuestionManager } from "./Manager";

export const dynamic = "force-dynamic";

function parseAnswers(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return typeof v === "object" && v ? v : {};
  } catch {
    return {};
  }
}

export default async function AdminConcierge() {
  await ensureDefaultQuestions();
  const [apps, questions] = await Promise.all([
    prisma.conciergeApplication.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.conciergeQuestion.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] }),
  ]);
  const newCount = apps.filter((a) => a.status === "new").length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-2xl font-bold">컨시어지 신청 관리</h1>
        <p className="text-sm text-sub">
          멤버십 업그레이드 페이지의 <b>가입 신청 팝업</b>으로 접수된 내역입니다.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          신청 내역 ({apps.length}) {newCount > 0 && <span className="text-brand">· 신규 {newCount}</span>}
        </h2>
        {apps.length === 0 ? (
          <div className="card p-6 text-sm text-sub">아직 접수된 신청이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {apps.map((a) => (
              <ApplicationRow
                key={a.id}
                a={{
                  id: a.id,
                  name: a.name,
                  phone: a.phone,
                  job: a.job,
                  region: a.region,
                  age: a.age,
                  answers: parseAnswers(a.answersJson),
                  status: a.status,
                  memo: a.memo,
                  createdAt: a.createdAt.toISOString().slice(0, 10),
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">신청 폼 문항 ({questions.length})</h2>
        <p className="mb-3 text-xs text-sub">
          이름·전화번호·직업·지역·나이는 기본 항목이고, 아래 문항이 추가로 노출됩니다.
        </p>
        <QuestionManager
          questions={questions.map((q) => ({
            id: q.id,
            label: q.label,
            type: q.type,
            options: parseList(q.optionsJson),
            required: q.required,
            active: q.active,
            sort: q.sort,
          }))}
        />
      </section>
    </div>
  );
}
