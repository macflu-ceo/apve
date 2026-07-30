import { prisma } from "@/lib/db";
import { isPushConfigured } from "@/lib/push";
import PushComposer from "./PushComposer";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date) {
  const s = new Date(d.getTime() + 9 * 3600_000).toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`;
}

const SEG_LABEL: Record<string, string> = { all: "전체", members: "회원", guests: "비회원" };

export default async function AdminPush() {
  const [total, members, byPlatform, logs] = await Promise.all([
    prisma.pushToken.count({ where: { active: true } }),
    prisma.pushToken.count({ where: { active: true, partnerId: { not: null } } }),
    prisma.pushToken.groupBy({ by: ["platform"], where: { active: true }, _count: { _all: true } }),
    prisma.pushLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const configured = isPushConfigured();
  const platMap = new Map(byPlatform.map((p) => [p.platform, p._count._all]));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">앱 푸시</h1>
      <p className="mb-6 text-sm text-sub">
        앱 설치자에게 푸시 알림을 발송하고 이력을 확인합니다. 대상은 <b>앱을 설치해 알림에 동의한 기기</b>입니다.
      </p>

      {/* 설정 상태 */}
      {!configured && (
        <div className="mb-4 rounded-xl2 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>⚠️ Firebase 키가 아직 설정되지 않았습니다.</b> 지금은 발송을 눌러도 <b>대상 집계·이력만</b> 남고 실제 알림은 안 갑니다.
          <br />앱(파이어베이스) 준비되면 환경변수 <code className="rounded bg-white/70 px-1">FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY</code> 를 Vercel에 넣으면 즉시 실제 발송됩니다.
        </div>
      )}

      {/* 토큰 현황 */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5"><div className="text-xs text-sub">알림 등록 기기</div><div className="mt-2 text-2xl font-bold">{total.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-sub">회원 연결</div><div className="mt-2 text-2xl font-bold">{members.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-sub">iOS</div><div className="mt-2 text-2xl font-bold">{(platMap.get("ios") ?? 0).toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-sub">Android</div><div className="mt-2 text-2xl font-bold">{(platMap.get("android") ?? 0).toLocaleString()}</div></div>
      </div>

      {/* 발송 */}
      <h2 className="mb-3 text-lg font-semibold">새 푸시 발송</h2>
      <div className="mb-6">
        <PushComposer tokenCount={total} />
      </div>

      {/* 가이드 */}
      <details className="mb-8 rounded-xl2 border border-line bg-[#fbfaf9] p-4 text-sm">
        <summary className="cursor-pointer font-bold">📖 앱 푸시 가이드 (열기)</summary>
        <div className="mt-3 space-y-3 text-ink/80">
          <div>
            <b>1. 누구에게 가나요?</b>
            <br />앱을 설치하고 <b>알림 허용</b>한 기기에만 갑니다. 설치·허용한 기기가 늘수록 "알림 등록 기기" 숫자가 올라가요.
          </div>
          <div>
            <b>2. 이미지 사이즈</b>
            <br />가로형 <b>2:1 (예: 1200×600)</b> 권장. 너무 세로로 길면 잘립니다. 용량은 1MB 이하가 안전해요.
          </div>
          <div>
            <b>3. 탭 시 이동 링크</b>
            <br /><code className="rounded bg-white px-1">/timesale</code>, <code className="rounded bg-white px-1">/goods/12345</code> 처럼 사이트 내부 경로를 넣으면 알림을 누를 때 그 화면으로 이동합니다. 비우면 앱 홈으로 열려요.
          </div>
          <div>
            <b>4. 테스트 발송(내 기기 토큰) 얻는 법</b>
            <br />전체 발송 전에 내 기기로 먼저 확인하세요. 토큰은:
            <ul className="ml-4 mt-1 list-disc space-y-0.5 text-xs">
              <li><b>앱 출시 후</b> — 내 폰에 앱 설치 → 알림 허용하면 그 기기 토큰이 자동 등록됩니다. (개발 중엔 앱에서 토큰을 로그로 찍어 복사)</li>
              <li><b>앱 전(웹 푸시)</b> — 원하시면 <b>브라우저 알림(웹 푸시)</b>도 붙여서 "이 브라우저로 테스트"를 한 번에 되게 해드릴 수 있어요. (Firebase 웹 앱 설정 필요 — 말씀 주세요)</li>
            </ul>
          </div>
          <div>
            <b>5. 자동 발송(트리거)</b>
            <br />"판매 발생 시", "골든타임 오픈 시" 같은 <b>특정 행동 자동 알림</b>도 붙일 수 있어요. 지금은 수기 발송이고, 트리거는 다음 단계에서 연결합니다.
          </div>
        </div>
      </details>

      {/* 현황(이력) */}
      <h2 className="mb-3 text-lg font-semibold">발송 현황</h2>
      {logs.length === 0 ? (
        <div className="card p-6 text-sm text-sub">발송 이력이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[#f7f6f4] text-left text-xs text-sub">
              <tr>
                <th className="px-3 py-2">일시</th>
                <th className="px-3 py-2">제목 / 내용</th>
                <th className="px-3 py-2">대상</th>
                <th className="px-3 py-2 text-right">발송</th>
                <th className="px-3 py-2 text-right">성공</th>
                <th className="px-3 py-2 text-right">실패</th>
                <th className="px-3 py-2">방식</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-sub">{fmtDateTime(l.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {l.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium">{l.title}</div>
                        <div className="line-clamp-1 text-xs text-sub">{l.body}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{SEG_LABEL[l.segment] ?? l.segment}{l.trigger !== "manual" && <span className="ml-1 rounded bg-brandsoft px-1 text-[10px]">{l.trigger}</span>}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.target.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-green-700">{l.sent.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-500">{l.failed.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${l.provider === "fcm" ? "bg-green-100 text-green-700" : "bg-line text-sub"}`}>
                      {l.provider === "fcm" ? "실발송" : "테스트"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
