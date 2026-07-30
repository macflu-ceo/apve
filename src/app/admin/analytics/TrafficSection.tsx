import type { DailyPoint, RetentionSummary } from "@/lib/analytics";

/** from~to 사이 모든 날짜(YYYY-MM-DD)를 채워 반환 (데이터 없는 날도 0으로) */
function fillDays(from: string, to: string, points: DailyPoint[]): DailyPoint[] {
  const map = new Map(points.map((p) => [p.day, p]));
  const out: DailyPoint[] = [];
  const cur = new Date(`${from}T00:00:00+09:00`);
  const end = new Date(`${to}T00:00:00+09:00`);
  let guard = 0;
  while (cur <= end && guard++ < 400) {
    const day = new Date(cur.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
    out.push(
      map.get(day) ?? {
        day,
        visitors: 0,
        returning: 0,
        sessions: 0,
        pageViews: 0,
        productViews: 0,
        clicks: 0,
      }
    );
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-sub">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-brand">{sub}</div>}
    </div>
  );
}

export default function TrafficSection({
  from,
  to,
  series,
  summary,
}: {
  from: string;
  to: string;
  series: DailyPoint[];
  summary: RetentionSummary;
}) {
  const days = fillDays(from, to, series);
  const maxV = Math.max(1, ...days.map((d) => d.visitors));

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">방문 · 리텐션</h2>

      {/* 리텐션 요약 카드 */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card
          label="순 방문자"
          value={`${summary.visitors.toLocaleString()}명`}
          sub={`회원 ${summary.loggedInVisitors.toLocaleString()}명 포함`}
        />
        <Card
          label="재방문율"
          value={`${summary.returnRate.toFixed(1)}%`}
          sub={`재방문 ${summary.returningVisitors.toLocaleString()}명`}
        />
        <Card
          label="1인당 방문 횟수"
          value={`${summary.visitsPerVisitor.toFixed(1)}회`}
          sub={`총 ${summary.sessions.toLocaleString()}세션`}
        />
        <Card
          label="세션당 페이지뷰"
          value={`${summary.pagesPerSession.toFixed(1)}p`}
          sub={`총 ${summary.pageViews.toLocaleString()} PV`}
        />
      </div>

      {/* 일자별 방문자 막대 (진한 부분 = 재방문) */}
      <div className="card mb-4 p-4">
        <div className="mb-3 flex items-center gap-4 text-xs text-sub">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand/35" /> 신규 방문
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" /> 재방문
          </span>
          <span className="ml-auto">일자별 순 방문자</span>
        </div>
        <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ height: 140 }}>
          {days.map((d) => {
            const h = (d.visitors / maxV) * 110;
            const retH = d.visitors > 0 ? (d.returning / d.visitors) * h : 0;
            return (
              <div
                key={d.day}
                className="flex min-w-[14px] flex-1 flex-col items-center justify-end"
                title={`${d.day}\n방문자 ${d.visitors} · 재방문 ${d.returning}\n세션 ${d.sessions} · PV ${d.pageViews} · 상품 ${d.productViews} · 클릭 ${d.clicks}`}
              >
                <div className="flex w-full max-w-[26px] flex-col justify-end rounded-t bg-brand/35" style={{ height: Math.max(h, d.visitors > 0 ? 3 : 0) }}>
                  <div className="w-full rounded-t bg-brand" style={{ height: retH }} />
                </div>
                <div className="mt-1 w-full truncate text-center text-[9px] leading-none text-sub">
                  {d.day.slice(5)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 일자별 상세 표 */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-[#f7f6f4] text-left text-xs text-sub">
            <tr>
              <th className="px-3 py-2">날짜</th>
              <th className="px-3 py-2 text-right">방문자</th>
              <th className="px-3 py-2 text-right">재방문</th>
              <th className="px-3 py-2 text-right">방문(세션)</th>
              <th className="px-3 py-2 text-right">페이지뷰</th>
              <th className="px-3 py-2 text-right">상품조회</th>
              <th className="px-3 py-2 text-right">클릭</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="whitespace-nowrap px-3 py-1.5 text-sub">{d.day}</td>
                <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-brand">{d.visitors.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{d.returning.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{d.sessions.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{d.pageViews.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{d.productViews.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{d.clicks.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
