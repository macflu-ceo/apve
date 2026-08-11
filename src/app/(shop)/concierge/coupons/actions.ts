"use server";

import { getConciergeViewer } from "@/lib/concierge-access";
import { issueCoupon } from "@/lib/coupon";
import { revalidatePath } from "next/cache";

export async function createCoupon(input: {
  storeId: string;
  priceType: "cp" | "ws";
  customerName: string;
  customerPhone: string;
  benefitText: string;
  brandsText: string;
  conditions: string;
  startAt: string; // YYYY-MM-DD
  endAt: string;
}) {
  const c = await getConciergeViewer();
  if (!c) return { ok: false as const, message: "권한이 없습니다." };
  if (!input.customerName.trim() || !input.customerPhone.trim()) return { ok: false as const, message: "고객 이름·연락처는 필수입니다." };
  if (!input.benefitText.trim()) return { ok: false as const, message: "적용 혜택을 입력하세요." };
  if (!input.storeId) return { ok: false as const, message: "매장을 선택하세요." };
  try {
    const coupon = await issueCoupon(c, {
      storeId: input.storeId,
      priceType: input.priceType,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      benefitText: input.benefitText,
      brandsText: input.brandsText,
      conditions: input.conditions,
      startAt: new Date(`${input.startAt}T00:00:00+09:00`),
      endAt: new Date(`${input.endAt}T23:59:59+09:00`),
    });
    revalidatePath("/concierge/coupons");
    return { ok: true as const, id: coupon.id, code: coupon.code };
  } catch (e) {
    return { ok: false as const, message: e instanceof Error ? e.message : "발급 실패" };
  }
}
