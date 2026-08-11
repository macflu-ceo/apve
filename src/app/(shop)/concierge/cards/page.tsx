import Link from "next/link";
import { redirect } from "next/navigation";
import { getConciergeViewer } from "@/lib/concierge-access";

export const dynamic = "force-dynamic";

export default async function Page() {
  const c = await getConciergeViewer();
  if (!c) redirect("/concierge"); // 컨시어지만 접근
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/concierge" className="text-sm text-sub hover:text-ink">← 컨시어지 홈</Link>
      <h1 className="mt-2 text-2xl font-bold">상품카드 생성기</h1>
      <div className="card mt-4 p-8 text-center text-sm text-sub">카드 템플릿·자동채움을 준비 중입니다.</div>
    </div>
  );
}
