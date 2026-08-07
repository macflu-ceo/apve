// 웹→앱 전환 리포트 (기본: 최근 7일)
//   미리보기: npx tsx scripts/webtoapp_report.ts [from] [to]
//   발송:     npx tsx scripts/webtoapp_report.ts --send
import "./loadenv";
import { buildWebToAppReport } from "../src/lib/report/webtoapp";
import { sendTelegram } from "../src/lib/telegram";

function kst(off = 0) { return new Date(Date.now() + 9 * 3600000 + off * 86400000).toISOString().slice(0, 10); }

async function main() {
  const args = process.argv.slice(2);
  const dates = args.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const from = dates[0] ?? kst(-7);
  const to = dates[1] ?? kst(-1);
  const rep = await buildWebToAppReport(from, to);
  console.log("── 웹→앱 전환 리포트 (" + from + " ~ " + to + ") ──\n");
  console.log(rep.text.replace(/<\/?b>/g, ""));
  if (args.includes("--send")) {
    const r = await sendTelegram(rep.text);
    console.log("\n" + (r.ok ? "✅ 발송 완료" : "✗ 발송 실패: " + r.error));
  }
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => process.exit());
