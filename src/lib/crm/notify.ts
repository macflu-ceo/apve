// 자동 알림톡 — 판매 발생 시 파트너에게 "회원님 코드로 판매됐어요" (정보성)
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/crm/send";

/**
 * 아직 알림 안 보낸 '구매확정' 판매를 찾아 파트너에게 알림톡 발송한다.
 * (판매 동기화 직후 호출) — 현재 mock, 발송대행사 연결 시 실발송.
 * @returns 알림 처리 건수
 */
export async function notifyNewSales(limit = 200): Promise<number> {
  const rows = await prisma.sale.findMany({
    where: { status: "confirmed", notifiedAt: null, partnerId: { not: null } },
    include: { partner: { select: { id: true, name: true, phone: true, channelFriend: true } } },
    orderBy: { orderedAt: "desc" },
    take: limit,
  });
  if (rows.length === 0) return 0;

  let done = 0;
  for (const s of rows) {
    if (!s.partner) continue;
    const goods = s.goodsName ?? "상품";
    const content =
      `[돈버는 명품샵] 판매 알림\n\n${s.partner.name}님의 코드로 상품이 판매되었어요! 🎉\n` +
      `· 상품: ${goods}\n· 예상 수수료: ${s.commission.toLocaleString()}원\n\n마이페이지에서 확인하세요.`;

    await sendMessage(
      { channel: "alimtalk", content, templateCode: "SALE_NOTIFY" },
      [{ phone: s.partner.phone, name: s.partner.name, channelFriend: s.partner.channelFriend }]
    );
    await prisma.sale.update({ where: { id: s.id }, data: { notifiedAt: new Date() } });
    done++;
  }
  return done;
}
