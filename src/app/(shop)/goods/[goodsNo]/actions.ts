"use server";

import { prisma } from "@/lib/db";
import { partnerLink } from "@/lib/godomall/link";
import { getSessionPartner } from "@/lib/auth";

/**
 * "내 코드 만들기" — 로그인된 파트너의 코드로 판매 링크 발급.
 * 비로그인 시 needAuth 신호를 반환해 프론트에서 로그인 모달을 띄운다.
 */
export async function issueLink(
  goodsNo: string
): Promise<{ ok: true; url: string; code: string } | { ok: false; needAuth?: boolean; message: string }> {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, message: "로그인이 필요합니다." };
  if (partner.status !== "approved" || !partner.code)
    return { ok: false, message: "승인대기중입니다. 관리자 승인 후 코드가 발급되면 이용할 수 있어요." };

  const product = await prisma.product.findUnique({ where: { goodsNo } });
  if (!product) return { ok: false, message: "상품을 찾을 수 없습니다." };

  const url = partnerLink(goodsNo, partner.code);
  await prisma.issuedLink.upsert({
    where: { partnerId_productId: { partnerId: partner.id, productId: product.id } },
    update: { url },
    create: { partnerId: partner.id, productId: product.id, url },
  });

  return { ok: true, url, code: partner.code };
}
