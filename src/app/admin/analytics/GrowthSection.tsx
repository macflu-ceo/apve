import type { ActiveUsers, Cohort, VisitorFunnel, Acquisition } from "@/lib/analytics";

function pct(n: number, d: number) {
  return d > 0 ? (n / d) * 100 : 0;
}

/** 리텐션% → 배경색 (진할수록 높음) */
function heat(p: number): string {
  if (p <= 0) return "transparent";
  const a = Math.min(1, 0.12 + (p / 100) * 0.88);
  return `rgba(138,111,94,${a.toFixed(2)})`; // brand 톤
}

export default function GrowthSection({
  asOf,
  active,
  cohorts,
  funnel,
  salesCount,
  acq,
  totalSessions,
}: {
  asOf: string;
  active: ActiveUsers;
  cohorts: Cohort[];
  funnel: VisitorFunnel;
  salesCount: number;
  acq: Acquisition;
  totalSessions: number;
}) {
  const steps = [
    { label: "방문자", value: funnel.visitors },
    { label: "상품 조회", value: funnel.viewers },
    { label: "코드 생성", value: funnel.coders },
    { label: "판매(확정)", value: salesCount },
  ];
  const maxStep = Math.max(1, ...steps.map((s) => s.value));
  const direct = Math.max(0, totalSessions - acq.referredSessions);

  return (
    <div className="mb-10">
      {/* 1) 활성 사용자 */}
      <h2 className="mb-1 text-lg font-semibold">활성 사용자</h2>
      <p className="mb-3 text-xs text-sub">{asOf} 기준 · 고착도 = DAU/MAU (높을수록 매일 쓰는 서비스)</p>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5"><div className="text-xs text-sub">DAU (오늘)</div><div className="mt-2 text-2xl font-bold">{active.dau.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-sub">WAU (7일)</div><div className="mt-2 text-2xl font-bold">{active.wau.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-sub">MAU (30일)</div><div className="mt-2 text-2xl font-bold">{active.mau.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-sub">고착도</div><div className="mt-2 text-2xl font-bold text-brand">{active.stickiness.toFixed(1)}%</div></div>
      </div>

      {/* 2) 퍼널 단계별 이탈 */}
      <h2 className="mb-1 text-lg font-semibold">퍼널 단계별 이탈</h2>
      <p className="mb-3 text-xs text-sub">방문자 기준 · 각 단계로 얼마나 넘어가고 어디서 빠지는지</p>
      <div className="card mb-8 space-y-2 p-5">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].value : s.value;
          const stepRate = i > 0 ? pct(s.value, prev) : 100;
          const drop = i > 0 ? 100 - stepRate : 0;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-sm text-sub">{s.label}</div>
              <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-[#f0ede9]">
                <div className="flex h-full items-center rounded-md bg-brand/80 px-2 text-xs font-bold text-white" style={{ width: `${Math.max(pct(s.value, maxStep), 3)}%` }}>
                  {s.value.toLocaleString()}
                </div>
              </div>
              <div className="w-28 shrink-0 text-right text-xs">
                {i === 0 ? (
                  <span className="text-sub">전체의 100%</span>
                ) : (
                  <>
                    <span className="font-semibold text-brand">{stepRate.toFixed(1)}%</span>
                    <span className="text-sub"> 전환 · </span>
                    <span className="text-red-500">-{drop.toFixed(0)}%</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3) 코호트 리텐션 */}
      <h2 className="mb-1 text-lg font-semibold">코호트 리텐션</h2>
      <p className="mb-3 text-xs text-sub">첫 방문 주차별로, N주 후 다시 온 비율. 진할수록 잘 남음.</p>
      {cohorts.length === 0 ? (
        <div className="card mb-8 p-6 text-sm text-sub">아직 코호트 데이터가 없습니다. (방문이 쌓이면 표시)</div>
      ) : (
        <div className="mb-8 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-[#f7f6f4] text-xs text-sub">
              <tr>
                <th className="px-3 py-2 text-left">첫 방문 주</th>
                <th className="px-3 py-2 text-right">인원</th>
                {["W0", "W1", "W2", "W3", "W4", "W5", "W6"].map((w) => (
                  <th key={w} className="px-2 py-2 text-center">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.week} className="border-t border-line">
                  <td className="whitespace-nowrap px-3 py-1.5 text-sub">{c.week}</td>
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{c.size.toLocaleString()}</td>
                  {c.retention.map((r, k) => (
                    <td
                      key={k}
                      className="px-2 py-1.5 text-center text-xs tabular-nums"
                      style={{ background: heat(r), color: r > 55 ? "#fff" : "inherit" }}
                      title={`${c.counts[k].toLocaleString()}명`}
                    >
                      {c.size > 0 ? `${r.toFixed(0)}%` : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4) 유입 경로 */}
      <h2 className="mb-1 text-lg font-semibold">유입 경로</h2>
      <p className="mb-3 text-xs text-sub">방문자가 어디서 왔는지 (세션 기준) · 데이터는 수집 시작 시점부터</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">외부 리퍼러 TOP</h3>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-line bg-[#fbfaf9]">
                  <td className="px-3 py-1.5 text-sub">직접/기타 (앱·북마크·검색앱 등)</td>
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{direct.toLocaleString()}</td>
                </tr>
                {acq.referrers.length === 0 ? (
                  <tr><td className="px-3 py-3 text-sub" colSpan={2}>외부 유입 데이터가 아직 없습니다.</td></tr>
                ) : (
                  acq.referrers.map((r) => (
                    <tr key={r.referrer} className="border-t border-line">
                      <td className="px-3 py-1.5">{r.referrer}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.sessions.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">UTM 캠페인</h3>
          <div className="overflow-hidden rounded-lg border border-line">
            {acq.campaigns.length === 0 ? (
              <div className="p-4 text-sm text-sub">
                아직 캠페인 유입이 없습니다. 광고·SNS 링크에 <code className="rounded bg-brandsoft px-1">?utm_source=insta&utm_campaign=여름</code> 처럼 붙이면 여기 집계됩니다.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#f7f6f4] text-xs text-sub">
                  <tr><th className="px-3 py-2 text-left">소스</th><th className="px-3 py-2 text-left">캠페인</th><th className="px-3 py-2 text-right">세션</th></tr>
                </thead>
                <tbody>
                  {acq.campaigns.map((c, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-1.5">{c.source}</td>
                      <td className="px-3 py-1.5 text-sub">{c.campaign ?? "-"}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{c.sessions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
