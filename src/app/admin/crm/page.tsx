import { prisma } from "@/lib/db";
import { parseList, won } from "@/lib/format";
import { listGrades } from "@/lib/grade";
import Composer from "./Composer";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.SITE_URL ?? "https://www.cashboutique.co.kr").replace(/\/$/, "");

const CH_LABEL: Record<string, string> = {
  friendtalk: "친구톡",
  alimtalk: "알림톡",
  sms: "문자",
};

export default async function AdminCrm() {
  const [grades, products, messages, memberCount, friendCount, marketingCount] = await Promise.all([
    listGrades(),
    prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.crmMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.partner.count({ where: { status: "approved" } }),
    prisma.partner.count({ where: { status: "approved", channelFriend: true } }),
    prisma.partner.count({ where: { status: "approved", marketingAgreed: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">CRM · 메시지 발송</h1>
      <p className="mb-4 text-sm text-sub">
        추천상품 판촉은 <b>친구톡</b>(채널 친구), 판매·정산 알림은 <b>알림톡</b>(정보성)으로 보냅니다.
        실제 발송은 <b>발송대행사 연결 후</b> 동작하며, 지금은 대상 계산·이력이 기록됩니다.
      </p>

      {/* 요약 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-sub">승인 회원</div>
          <div className="mt-1 text-lg font-bold">{memberCount.toLocaleString()}명</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-sub">채널 친구(친구톡 대상)</div>
          <div className="mt-1 text-lg font-bold">{friendCount.toLocaleString()}명</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-sub">마케팅 수신 동의</div>
          <div className="mt-1 text-lg font-bold">{marketingCount.toLocaleString()}명</div>
        </div>
      </div>

      <Composer
        grades={grades.map((g) => ({ id: g.id, name: g.name }))}
        siteUrl={SITE_URL}
        products={products.map((p) => ({
          id: p.id,
          goodsNo: p.goodsNo,
          name: p.name,
          image: parseList(p.imagesJson)[0] ?? null,
          salePrice: p.salePrice,
        }))}
      />

      {/* 발송 이력 */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">발송 이력</h2>
        {messages.length === 0 ? (
          <div className="card p-6 text-sm text-sub">아직 발송 이력이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line text-left text-sub">
                <tr>
                  <th className="py-2">일시</th>
                  <th>제목</th>
                  <th>채널</th>
                  <th className="text-right">대상</th>
                  <th className="text-right">발송</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="border-b border-line">
                    <td className="whitespace-nowrap py-2 text-sub">
                      {new Date(m.createdAt.getTime() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ")}
                    </td>
                    <td className="max-w-[240px] truncate">{m.title}</td>
                    <td>{CH_LABEL[m.channel] ?? m.channel}</td>
                    <td className="text-right tabular-nums">{m.targetCount.toLocaleString()}</td>
                    <td className="text-right tabular-nums">{m.sentCount.toLocaleString()}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.status === "sent" ? "bg-deal/15 text-deal" : "bg-red-100 text-red-600"}`}>
                        {m.status === "sent" ? "발송" : "실패"}
                      </span>
                    </td>
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
