// 단발 이벤트 알림톡 — 정산 완료 / 가입 승인
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/crm/send";
import { render } from "@/lib/crm/rules";

const won = (n: number) => n.toLocaleString("ko-KR");

/** 정산 완료 시 파트너에게 알림톡 */
export async function notifySettlement(partnerId: string, paidAmount: number) {
  const rule = await prisma.alimtalkRule.findFirst({ where: { trigger: "settlement", active: true } });
  if (!rule) return;
  const p = await prisma.partner.findUnique({ where: { id: partnerId }, select: { name: true, phone: true, channelFriend: true } });
  if (!p) return;
  const content = render(rule.message, { 이름: p.name, 수수료: won(paidAmount) });
  const r = await sendMessage({ channel: "alimtalk", content, templateCode: rule.templateCode }, [
    { phone: p.phone, name: p.name, channelFriend: p.channelFriend },
  ]);
  await prisma.alimtalkLog.create({
    data: { trigger: "settlement", ruleName: rule.name, target: 1, sent: r.sent, provider: r.provider },
  });
}

/** 가입 승인 시 환영 알림톡 */
export async function notifySignupApproved(partnerId: string) {
  const rule = await prisma.alimtalkRule.findFirst({ where: { trigger: "signup", active: true } });
  if (!rule) return;
  const p = await prisma.partner.findUnique({ where: { id: partnerId }, select: { name: true, phone: true, channelFriend: true } });
  if (!p) return;
  const content = render(rule.message, { 이름: p.name });
  const r = await sendMessage({ channel: "alimtalk", content, templateCode: rule.templateCode }, [
    { phone: p.phone, name: p.name, channelFriend: p.channelFriend },
  ]);
  await prisma.alimtalkLog.create({
    data: { trigger: "signup", ruleName: rule.name, target: 1, sent: r.sent, provider: r.provider },
  });
}
