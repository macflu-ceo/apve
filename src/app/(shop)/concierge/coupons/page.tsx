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
      <h1 className="mt-2 text-2xl font-bold">매장 특별 이용 권한</h1>
      <div className="card mt-4 p-8 text-center text-sm text-sub">발급·고객 화면·QR 사용처리를 준비 중입니다.</div>
    </div>
  );
}
