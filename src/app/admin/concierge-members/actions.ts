"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** 회원을 컨시어지로 임명 — 다음 컨시어지 번호를 원자적으로 부여 */
export async function appointConcierge(username: string) {
  const u = username.trim();
  if (!u) return { ok: false, message: "아이디를 입력하세요." };
  const partner = await prisma.partner.findUnique({ where: { username: u } });
  if (!partner) return { ok: false, message: "해당 아이디의 회원이 없습니다." };
  if (partner.conciergeNo != null) return { ok: false, message: `이미 컨시어지입니다 (No.${partner.conciergeNo}).` };

  // 다음 번호 = 현재 최대 + 1 (경합 시 unique 제약으로 재시도)
  for (let attempt = 0; attempt < 5; attempt++) {
    const max = await prisma.partner.aggregate({ _max: { conciergeNo: true } });
    const next = (max._max.conciergeNo ?? 0) + 1 + attempt;
    try {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { conciergeNo: next, conciergeStartedAt: new Date() },
      });
      revalidatePath("/admin/concierge-members");
      return { ok: true, message: `${partner.name}님을 컨시어지 No.${next}로 임명했습니다.` };
    } catch {
      /* unique 충돌 → 다음 번호 재시도 */
    }
  }
  return { ok: false, message: "번호 부여에 실패했습니다. 다시 시도해주세요." };
}

/** 컨시어지 해제 */
export async function revokeConcierge(partnerId: string) {
  await prisma.partner.update({ where: { id: partnerId }, data: { conciergeNo: null } });
  revalidatePath("/admin/concierge-members");
  return { ok: true, message: "컨시어지를 해제했습니다." };
}

/**
 * 자격 구간 연장.
 *
 * 오늘부터 다시 3개월을 센다. 남은 날짜를 더해 주는 게 아니라 새로 시작한다 —
 * 실적을 채워 연장하는 것이므로 이전 구간의 매출은 다음 구간에 얹지 않는다.
 */
export async function extendConcierge(partnerId: string) {
  await prisma.partner.update({
    where: { id: partnerId },
    data: { conciergeStartedAt: new Date() },
  });
  revalidatePath("/admin/concierge-members");
  return { ok: true, message: "3개월 연장했습니다." };
}
