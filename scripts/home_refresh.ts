// 홈 자동 갱신 실행 — 재고·가격 최신화 + 신규 상품 등록 + 섹션 재편성 + 텔레그램 알림
//   미리보기(쓰기X):  npx tsx scripts/home_refresh.ts
//   실제 실행:        npx tsx scripts/home_refresh.ts --commit
//   실행+텔레그램알림: npx tsx scripts/home_refresh.ts --commit --notify
//   신규 미포함:      npx tsx scripts/home_refresh.ts --commit --no-new
import "./loadenv";
import "./catalogenv";
import { runHomeRefresh, homeRefreshText } from "../src/lib/godomall/homeRefresh";
import { sendTelegram } from "../src/lib/telegram";
import { prisma } from "../src/lib/db";

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const injectNew = !args.includes("--no-new");
  const notify = args.includes("--notify");

  console.log(`홈 갱신 · commit=${commit} · 신규등록=${injectNew}`);
  const r = await runHomeRefresh({ commit, injectNew, log: (s) => process.stdout.write(s.startsWith("  ") ? "" : "\n" + s) });
  console.log("\n\n── 결과 ──");
  console.log(homeRefreshText(r).replace(/<\/?b>/g, ""));
  if (!commit) console.log("\n※ 미리보기입니다. 실제 반영하려면 --commit");

  if (commit && notify) {
    const t = await sendTelegram(homeRefreshText(r));
    console.log(t.ok ? "\n✅ 텔레그램 알림 발송" : "\n✗ 알림 실패: " + t.error);
  }
}
main().catch((e) => { console.error("오류:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
