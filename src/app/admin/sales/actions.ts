"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { syncConciergeSales } from "@/lib/godomall/sales";

export async function syncSalesAction(from: string, to: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { ok: false, message: "날짜 형식이 올바르지 않습니다." };
  }

  try {
    const r = await syncConciergeSales(from, to);
    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    const parts = [`${r.fetched}건 조회`, `${r.upserted}건 반영`];
    if (r.canceled > 0) parts.push(`취소 ${r.canceled}건`);
    if (r.skippedUnpaid > 0) parts.push(`미결제 ${r.skippedUnpaid}건 제외`);
    if (r.unmatchedCode > 0) parts.push(`⚠️ 코드 미매칭 ${r.unmatchedCode}건`);
    return { ok: true, message: parts.join(" · ") };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "동기화 실패" };
  }
}
