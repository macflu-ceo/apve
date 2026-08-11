import Link from "next/link";
import { redirect } from "next/navigation";
import { getConciergeViewer } from "@/lib/concierge-access";
import CardStudio from "./CardStudio";

export const dynamic = "force-dynamic";

export default async function ConciergeCardsPage() {
  const c = await getConciergeViewer();
  if (!c) redirect("/concierge");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/concierge" className="text-sm text-sub hover:text-ink">← 컨시어지 홈</Link>
      <h1 className="mt-2 text-2xl font-bold">상품카드 생성기</h1>
      <p className="mb-5 mt-1 text-sm text-sub">상품을 검색해 불러오면 텍스트가 자동으로 채워집니다. 템플릿을 고르고 PNG로 저장하세요.</p>
      <CardStudio />
    </div>
  );
}
