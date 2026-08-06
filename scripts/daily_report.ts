// 데일리 리포트 테스트/수동 실행
//   미리보기(발송X): npx tsx scripts/daily_report.ts [YYYY-MM-DD]
//   텔레그램 발송:   npx tsx scripts/daily_report.ts --send
//   chat_id 조회:    npx tsx scripts/daily_report.ts --chatid   (봇에게 메시지 먼저 보낸 뒤)
import "./loadenv";
import { buildDailyReport } from "../src/lib/report/daily";
import { sendTelegram, getTelegramChatId } from "../src/lib/telegram";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--chatid")) {
    const ids = await getTelegramChatId();
    console.log("발견된 chat_id:", ids.length ? ids.join(", ") : "(없음 — 봇에게 아무 메시지나 먼저 보내세요)");
    return;
  }
  const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const report = await buildDailyReport(date);
  console.log("── 리포트 미리보기 (" + report.date + ") ──\n");
  console.log(report.text.replace(/<\/?b>/g, ""));
  console.log("");
  if (args.includes("--send")) {
    const r = await sendTelegram(report.text);
    console.log(r.ok ? "✅ 텔레그램 발송 완료" : "✗ 발송 실패: " + r.error);
  }
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => process.exit());
