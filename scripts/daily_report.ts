// 정기 보고 테스트/수동 실행 (일/주/월)
//   미리보기(발송X):  npx tsx scripts/daily_report.ts            (오늘 기준 자동 단위)
//                     npx tsx scripts/daily_report.ts --week     (주보고 강제)
//                     npx tsx scripts/daily_report.ts --month    (월보고 강제)
//   텔레그램 발송:     npx tsx scripts/daily_report.ts --send
//   chat_id 조회:      npx tsx scripts/daily_report.ts --chatid  (봇에게 메시지 먼저 보낸 뒤)
import "./loadenv";
import { buildReport, pickPeriod, type Period } from "../src/lib/report/report";
import { sendTelegram, getTelegramChatId } from "../src/lib/telegram";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--chatid")) {
    const ids = await getTelegramChatId();
    console.log("발견된 chat_id:", ids.length ? ids.join(", ") : "(없음 — 봇에게 아무 메시지나 먼저 보내세요)");
    return;
  }
  const period: Period = args.includes("--month") ? "month" : args.includes("--week") ? "week" : args.includes("--day") ? "day" : pickPeriod();
  const report = await buildReport(period);
  console.log(`── ${period} 보고 미리보기 (${report.from}~${report.to}) ──\n`);
  console.log(report.text.replace(/<\/?b>/g, ""));
  console.log("");
  if (args.includes("--send")) {
    const r = await sendTelegram(report.text);
    console.log(r.ok ? "✅ 텔레그램 발송 완료" : "✗ 발송 실패: " + r.error);
  }
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => process.exit());
