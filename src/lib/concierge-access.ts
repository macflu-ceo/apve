import { getCurrentPartner } from "@/lib/session";

/** 컨시어지 뷰어 — conciergeNo가 있으면 컨시어지 자격(매장링크·상품카드·전용공지 접근). */
export type ConciergeViewer = { id: string; name: string; conciergeNo: number };

export async function getConciergeViewer(): Promise<ConciergeViewer | null> {
  const p = await getCurrentPartner();
  if (!p || p.conciergeNo == null) return null;
  return { id: p.id, name: p.name, conciergeNo: p.conciergeNo };
}

/** 컨시어지 번호 → 3자리 코드 (1 → "001") */
export function conciergeCode(no: number): string {
  return String(no).padStart(3, "0");
}
