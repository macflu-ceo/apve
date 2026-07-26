import { prisma } from "@/lib/db";
import { SEGMENTS, segmentCount } from "@/lib/crm/segments";
import { TRIGGERS, listRules } from "@/lib/crm/rules";
import RuleManager from "./RuleManager";

export const dynamic = "force-dynamic";

export default async function AdminCrm() {
  const [rules, logs, memberCount, friendCount, ...segCounts] = await Promise.all([
    listRules(),
    prisma.alimtalkLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.partner.count({ where: { status: "approved" } }),
    prisma.partner.count({ where: { status: "approved", channelFriend: true } }),
    ...SEGMENTS.map((s) => segmentCount(s.key)),
  ]);

  const segWithCount = SEGMENTS.map((s, i) => ({ ...s, count: segCounts[i] }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">CRM · 알림톡 자동발송</h1>
      <p className="mb-5 text-sm text-sub">
        <b>어떤 세그먼트</b>에게 <b>어떤 조건(트리거)</b>으로 알림톡을 보낼지 규칙으로 관리합니다. (판매·수수료·정산·가입 등 정보성)
        <br />
        추천상품 판촉(친구톡)은 카카오 채널에서 직접 발송하세요. 실제 발송은 <b>채널 승인·발송대행사 연결 후</b> 동작합니다.
      </p>

      {/* 세그먼트 현황 */}
      <div className="mb-8">
        <div className="mb-2 text-sm font-bold">회원 세그먼트</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {segWithCount.map((s) => (
            <div key={s.key} className="card p-4">
              <div className="text-xs font-bold text-brand">{s.label}</div>
              <div className="mt-1 text-xl font-black">{s.count.toLocaleString()}명</div>
              <div className="mt-0.5 text-[11px] leading-tight text-sub">{s.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-sub">
          채널 친구(친구톡 대상) {friendCount.toLocaleString()}명 · 승인 회원 {memberCount.toLocaleString()}명
        </p>
      </div>

      <RuleManager
        rules={rules.map((r) => ({
          id: r.id, name: r.name, trigger: r.trigger, segment: r.segment,
          threshold: r.threshold, message: r.message, active: r.active,
        }))}
        triggers={TRIGGERS.map((t) => ({ ...t }))}
        segments={SEGMENTS.map((s) => ({ ...s }))}
      />

      {/* 발송 로그 */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">발송 로그</h2>
        {logs.length === 0 ? (
          <div className="card p-6 text-sm text-sub">아직 발송 로그가 없습니다. (판매 동기화 시 자동 기록)</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr>
                  <th className="py-2">일시</th>
                  <th>규칙</th>
                  <th className="text-right">대상</th>
                  <th className="text-right">발송</th>
                  <th>발송사</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-line">
                    <td className="whitespace-nowrap py-2 text-sub">
                      {new Date(l.createdAt.getTime() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ")}
                    </td>
                    <td>{l.ruleName}</td>
                    <td className="text-right tabular-nums">{l.target}</td>
                    <td className="text-right tabular-nums">{l.sent}</td>
                    <td className="text-sub">{l.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
