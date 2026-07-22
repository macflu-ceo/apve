// 판매내역(전환) 연동 어댑터
// 고도몰이 주문에 유입 code를 기록하므로, 그 데이터를 주기적으로 "가져와(pull)"
// code 기준으로 파트너에 귀속시켜 Sale 테이블에 적재한다.
//
// ⚠️ 통로 미확정: 고도몰 프로 관리자에 Open API / 제휴마케팅 정산 데이터가 있는지
//    확인 후 fetchRawSales()를 실제 구현으로 교체. 지금은 수동 업로드/더미로 동작.

import { prisma } from "@/lib/db";
import { getPartnerGrade } from "@/lib/grade";

export interface RawSale {
  code: string;          // 유입 파트너 코드
  goodsNo: string;       // 상품번호
  amount: number;        // 판매금액(원)
  orderNo?: string;
  orderedAt: string;     // ISO date
  status?: "confirmed" | "pending" | "canceled";
}

/**
 * 고도몰에서 원시 판매내역을 가져온다.
 * TODO: 고도몰 Open API 또는 제휴마케팅 CSV export 연동으로 교체.
 * 현재는 인자로 받은 배열(수동 업로드/CSV 파싱 결과)을 그대로 통과시킨다.
 */
export async function fetchRawSales(manual: RawSale[] = []): Promise<RawSale[]> {
  return manual;
}

/** 원시 판매내역을 파트너/상품에 매칭해 DB에 적재하고, 수수료를 계산한다. */
export async function ingestSales(rows: RawSale[]) {
  let inserted = 0;
  for (const row of rows) {
    const product = await prisma.product.findUnique({ where: { goodsNo: row.goodsNo } });
    if (!product) continue; // 플랫폼에 등록되지 않은 상품은 스킵
    const partner = await prisma.partner.findUnique({ where: { code: row.code } });
    // 수수료율은 파트너의 '등급'에 귀속
    const grade = partner ? await getPartnerGrade(partner.id) : null;
    const commission = Math.round((row.amount * (grade?.percent ?? 0)) / 100);

    await prisma.sale.create({
      data: {
        productId: product.id,
        partnerId: partner?.id ?? null,
        code: row.code,
        amount: row.amount,
        commission,
        status: row.status ?? "confirmed",
        orderNo: row.orderNo,
        orderedAt: new Date(row.orderedAt),
      },
    });
    inserted++;
  }
  return { inserted };
}
