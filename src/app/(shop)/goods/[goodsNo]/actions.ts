"use server";

import { prisma } from "@/lib/db";
import { partnerLink } from "@/lib/godomall/link";
import { getSessionPartner } from "@/lib/auth";
import { getPlatform } from "@/lib/platform";
import { getSiteSetting } from "@/lib/settings";

type IssueResult =
  | { ok: true; url: string; code: string }
  | {
      ok: false;
      needAuth?: boolean;
      /** 웹 일일 한도 초과 → 앱 유도 */
      needApp?: boolean;
      ios?: string | null;
      android?: string | null;
      landing?: string | null;
      message: string;
    };

/** KST 기준 오늘 0시 (Date) */
function kstTodayStart(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600_000);
}

/**
 * "내 코드 만들기" — 로그인된 파트너의 코드로 판매 링크 발급.
 * 비로그인 시 needAuth. 웹에서 하루 한도(기본 3개) 초과 시 needApp(앱 유도).
 */
export async function issueLink(goodsNo: string): Promise<IssueResult> {
  const partner = await getSessionPartner();
  if (!partner) return { ok: false, needAuth: true, message: "로그인이 필요합니다." };
  if (partner.status !== "approved" || !partner.code)
    return { ok: false, message: "승인대기중입니다. 관리자 승인 후 코드가 발급되면 이용할 수 있어요." };

  const product = await prisma.product.findUnique({ where: { goodsNo } });
  if (!product) return { ok: false, message: "상품을 찾을 수 없습니다." };

  // 이미 발급한 상품은 재복사 허용(한도 미차감). 새 상품일 때만 한도 검사.
  const existing = await prisma.issuedLink.findUnique({
    where: { partnerId_productId: { partnerId: partner.id, productId: product.id } },
    select: { id: true },
  });

  if (!existing) {
    const platform = getPlatform();
    const setting = await getSiteSetting();
    const limit = setting.webDailyCodeLimit ?? 3;
    // 앱은 무제한. 웹만 한도 적용.
    if (platform === "web" && limit > 0) {
      const todayCount = await prisma.issuedLink.count({
        where: { partnerId: partner.id, createdAt: { gte: kstTodayStart() } },
      });
      if (todayCount >= limit) {
        return {
          ok: false,
          needApp: true,
          ios: setting.appIosUrl,
          android: setting.appAndroidUrl,
          landing: setting.appLandingUrl,
          message: `웹에서는 하루 ${limit}개까지 코드를 만들 수 있어요. 앱에서는 무제한으로 이용하세요!`,
        };
      }
    }
  }

  const url = partnerLink(goodsNo, partner.code);
  await prisma.issuedLink.upsert({
    where: { partnerId_productId: { partnerId: partner.id, productId: product.id } },
    update: { url },
    create: { partnerId: partner.id, productId: product.id, url },
  });

  return { ok: true, url, code: partner.code };
}
