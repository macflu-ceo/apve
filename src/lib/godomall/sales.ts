// 판매내역(전환) 연동 어댑터
// 고도몰 관리자 [영업사원 통계] 와 동일한 데이터를, 커스텀 API 엔드포인트에서 가져온다.
//   엔드포인트: https://api.viaelite.co.kr/concierge/sales  (module/Controller/Api/Concierge/SalesController.php)
//   응답: { total, list: [{ orderNo, code, orderedAt, confirmedAt, settleStatus, goodsNo, goodsNm, ... }] }
//
// code(salesAgentCode) 기준으로 파트너에 귀속시키고, 수수료는 파트너 '등급'의 %로 계산한다.

import { prisma } from "@/lib/db";
import { getPartnerGrade } from "@/lib/grade";

/** 고도몰 API 한 행 */
export interface GodoSaleRow {
  orderNo: string;
  code: string;
  orderedAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  confirmedAt: string | null;
  orderStatus: string;
  settleStatus: "confirmed" | "pending" | "canceled";
  goodsNo: string;
  goodsNm: string;
  brand: string | null;
  origin: string | null;
  optionName: string;
  qty: number;
  salePrice: number;
  listPrice: number;
  discount: number;
  amount: number;
}

const API_URL = process.env.GODO_SALES_API_URL || "https://api.viaelite.co.kr/concierge/sales";
const API_KEY = process.env.GODO_SALES_API_KEY || "";

/** 고도몰에서 기간별 판매내역을 가져온다. scope=all 이면 취소/반품까지 포함. */
export async function fetchConciergeSales(
  from: string,
  to: string,
  opts: { code?: string; scope?: "valid" | "all" } = {}
): Promise<GodoSaleRow[]> {
  const scope = opts.scope ?? "all";
  const url = new URL(API_URL);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("scope", scope);
  if (opts.code) url.searchParams.set("code", opts.code);

  const res = await fetch(url.toString(), {
    headers: { "X-API-KEY": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`고도몰 API 오류 (${res.status})`);

  const data = await res.json();
  if (data?.error) throw new Error(`고도몰 API: ${data.error}`);
  const list: GodoSaleRow[] = Array.isArray(data?.list) ? data.list : [];
  // 고도몰이 goodsNo/orderNo/code를 숫자로 줄 수 있어 문자열로 정규화
  return list.map((r) => ({
    ...r,
    goodsNo: r.goodsNo != null ? String(r.goodsNo) : r.goodsNo,
    orderNo: r.orderNo != null ? String(r.orderNo) : r.orderNo,
    code: r.code != null ? String(r.code) : r.code,
  }));
}

/** 날짜 문자열 → Date (없으면 null) */
function toDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface SyncResult {
  fetched: number;
  upserted: number;
  skippedUnpaid: number;
  unmatchedCode: number;
  canceled: number;
}

/**
 * 기간을 지정해 고도몰 판매내역을 동기화한다.
 *  · syncKey(orderNo|goodsNo|optionName) 로 중복 없이 upsert
 *  · 미결제(orderStatus 'o%')는 건너뜀
 *  · 취소/반품/교환/환불은 status=canceled 로 반영 (기존에 넣었던 건도 갱신됨)
 *  · 수수료는 파트너 등급 %로 재계산
 */
export async function syncConciergeSales(from: string, to: string): Promise<SyncResult> {
  const rows = await fetchConciergeSales(from, to, { scope: "all" });

  const result: SyncResult = {
    fetched: rows.length,
    upserted: 0,
    skippedUnpaid: 0,
    unmatchedCode: 0,
    canceled: 0,
  };

  // 등급 %는 파트너별로 한 번만 조회 (캐시)
  const gradeCache = new Map<string, number>();

  for (const row of rows) {
    // 미결제(입금대기)는 아직 판매가 아님 → 스킵
    if (row.orderStatus && row.orderStatus.toLowerCase().startsWith("o")) {
      result.skippedUnpaid++;
      continue;
    }

    const partner = row.code
      ? await prisma.partner.findUnique({ where: { code: row.code } })
      : null;
    if (!partner) result.unmatchedCode++;

    let percent = 0;
    if (partner) {
      if (gradeCache.has(partner.id)) {
        percent = gradeCache.get(partner.id)!;
      } else {
        const grade = await getPartnerGrade(partner.id);
        percent = grade?.percent ?? 0;
        gradeCache.set(partner.id, percent);
      }
    }

    const product = row.goodsNo
      ? await prisma.product.findUnique({ where: { goodsNo: row.goodsNo }, select: { id: true } })
      : null;

    const amount = Math.round(row.amount ?? 0);
    const commission = row.settleStatus === "canceled" ? 0 : Math.round((amount * percent) / 100);
    if (row.settleStatus === "canceled") result.canceled++;

    const syncKey = `${row.orderNo}|${row.goodsNo}|${row.optionName ?? ""}`;

    const payload = {
      productId: product?.id ?? null,
      partnerId: partner?.id ?? null,
      code: row.code,
      amount,
      commission,
      status: row.settleStatus,
      orderNo: row.orderNo,
      orderedAt: toDate(row.orderedAt) ?? new Date(),
      goodsNo: row.goodsNo,
      goodsName: row.goodsNm,
      optionName: row.optionName || null,
      qty: row.qty ?? 1,
      listPrice: row.listPrice ?? null,
      discount: row.discount ?? null,
      confirmedAt: toDate(row.confirmedAt),
      source: "godomall",
    };

    await prisma.sale.upsert({
      where: { syncKey },
      update: payload,
      create: { syncKey, ...payload },
    });
    result.upserted++;
  }

  return result;
}
