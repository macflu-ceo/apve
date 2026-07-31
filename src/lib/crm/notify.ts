// 알림톡 트리거 실행 — 판매 발생 / 수수료 마일스톤 (판매 동기화 직후 호출)
// 현재 mock 발송, 발송대행사 연결 시 실발송으로 전환.
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/crm/send";
import { render } from "@/lib/crm/rules";
import { segmentWhere, type SegmentKey } from "@/lib/crm/segments";
import { getSiteSetting } from "@/lib/settings";
import { sendPushToPartner } from "@/lib/push";

const won = (n: number) => n.toLocaleString("ko-KR");

async function log(trigger: string, ruleName: string, target: number, sent: number, provider: string) {
  await prisma.alimtalkLog.create({ data: { trigger, ruleName, target, sent, provider } });
}

/** 파트너가 세그먼트에 속하는지 (all이면 항상 true) */
async function inSegment(partnerId: string, segment: string): Promise<boolean> {
  if (segment === "all") return true;
  const w = segmentWhere(segment as SegmentKey);
  const hit = await prisma.partner.findFirst({ where: { AND: [{ id: partnerId }, w] }, select: { id: true } });
  return !!hit;
}

/** 판매 발생 알림톡 + (설정 시) 앱 푸시 — 아직 알림 안 보낸 구매확정 건 대상 */
export async function notifyNewSales(limit = 300): Promise<number> {
  const setting = await getSiteSetting().catch(() => null);
  const pushOnSale = !!setting?.pushOnSale;
  const rule = await prisma.alimtalkRule.findFirst({ where: { trigger: "sale", active: true } });
  if (!rule && !pushOnSale) return 0; // 알림톡 규칙도 없고 푸시도 꺼져있으면 할 일 없음

  const rows = await prisma.sale.findMany({
    where: { status: "confirmed", notifiedAt: null, partnerId: { not: null } },
    include: { partner: { select: { id: true, name: true, phone: true, channelFriend: true } } },
    orderBy: { orderedAt: "desc" },
    take: limit,
  });
  if (rows.length === 0) return 0;

  let sent = 0;
  let pushTarget = 0;
  let pushSent = 0;
  let pushProvider = "mock";
  for (const s of rows) {
    if (!s.partner) continue;
    // 알림톡
    if (rule) {
      const ok = await inSegment(s.partner.id, rule.segment);
      if (ok) {
        const content = render(rule.message, { 이름: s.partner.name, 상품: s.goodsName ?? "상품", 수수료: won(s.commission) });
        const r = await sendMessage(
          { channel: "alimtalk", content, templateCode: rule.templateCode },
          [{ phone: s.partner.phone, name: s.partner.name, channelFriend: s.partner.channelFriend }]
        );
        sent += r.sent;
      }
    }
    // 앱 푸시 (특정행동 트리거)
    if (pushOnSale) {
      const pr = await sendPushToPartner(s.partner.id, {
        title: "💰 판매가 발생했어요!",
        body: `${s.goodsName ?? "상품"} · 예상 수수료 ${won(s.commission)}원`,
        url: "/me",
      });
      pushTarget += pr.target;
      pushSent += pr.sent;
      pushProvider = pr.provider;
    }
    await prisma.sale.update({ where: { id: s.id }, data: { notifiedAt: new Date() } });
  }
  if (rule) await log("sale", rule.name, rows.length, sent, process.env.CRM_PROVIDER ?? "mock");
  if (pushOnSale && pushTarget > 0) {
    await prisma.pushLog.create({
      data: {
        title: "판매 발생 자동 알림",
        body: `판매 ${rows.length}건 · 회원 앱 푸시`,
        segment: "members",
        trigger: "sale",
        target: pushTarget,
        sent: pushSent,
        failed: pushTarget - pushSent,
        provider: pushProvider,
      },
    });
  }
  return sent;
}

/** 수수료 마일스톤 알림톡 — 누적 확정 수수료가 규칙 임계값을 새로 넘긴 파트너 */
export async function notifyCommissionMilestones(): Promise<number> {
  const rules = await prisma.alimtalkRule.findMany({
    where: { trigger: "commission", active: true, threshold: { not: null } },
    orderBy: { threshold: "asc" },
  });
  if (rules.length === 0) return 0;

  // 파트너별 확정 수수료 합계
  const agg = await prisma.sale.groupBy({
    by: ["partnerId"],
    where: { status: "confirmed", partnerId: { not: null } },
    _sum: { commission: true },
  });

  let sent = 0;
  for (const a of agg) {
    if (!a.partnerId) continue;
    const total = a._sum.commission ?? 0;
    const partner = await prisma.partner.findUnique({
      where: { id: a.partnerId },
      select: { id: true, name: true, phone: true, channelFriend: true, notifiedMilestone: true },
    });
    if (!partner) continue;

    // 이미 알린 마일스톤보다 크고, 현재 누적이 넘긴 규칙 중 가장 높은 것
    const crossed = rules.filter((r) => (r.threshold ?? 0) > partner.notifiedMilestone && total >= (r.threshold ?? 0));
    if (crossed.length === 0) continue;
    const top = crossed[crossed.length - 1];

    const ok = await inSegment(partner.id, top.segment);
    if (ok) {
      const content = render(top.message, { 이름: partner.name, 누적수수료: won(total) });
      const r = await sendMessage(
        { channel: "alimtalk", content, templateCode: top.templateCode },
        [{ phone: partner.phone, name: partner.name, channelFriend: partner.channelFriend }]
      );
      sent += r.sent;
      await log("commission", top.name, 1, r.sent, process.env.CRM_PROVIDER ?? "mock");
    }
    await prisma.partner.update({ where: { id: partner.id }, data: { notifiedMilestone: top.threshold ?? 0 } });
  }
  return sent;
}

/** 판매 동기화 후 한 번에 실행 */
export async function runSaleTriggers(): Promise<{ sale: number; milestone: number; boosted: number }> {
  // 20% 바우처 소진(적용된 상품의 최초 판매에 20% 적용)을 알림 전에 처리 → 알림 금액도 정확
  const { consumeVouchersForSales } = await import("@/lib/voucher");
  const boosted = await consumeVouchersForSales();
  const sale = await notifyNewSales();
  const milestone = await notifyCommissionMilestones();
  return { sale, milestone, boosted };
}
