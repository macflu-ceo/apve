import { prisma } from "@/lib/db";
import StoreForm from "./StoreForm";

export const dynamic = "force-dynamic";

export default async function ConciergeStoresPage() {
  const stores = await prisma.store.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">매장 관리</h1>
      <p className="mb-5 text-sm text-sub">매장 정보와 <b>스캔 PIN</b>을 설정합니다. 매장 직원은 스캔 페이지에서 이 PIN으로 접근합니다.</p>

      <div className="card mb-6 p-5">
        <h2 className="mb-3 text-base font-bold">새 매장 추가</h2>
        <StoreForm />
      </div>

      <div className="space-y-4">
        {stores.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{s.code}</code>
              <span className="font-bold">{s.name}</span>
              {!s.pinHash && <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">PIN 미설정</span>}
            </div>
            <StoreForm store={{ id: s.id, name: s.name, code: s.code, address: s.address, hours: s.hours, mapUrl: s.mapUrl, hasPin: !!s.pinHash }} />
          </div>
        ))}
      </div>
    </div>
  );
}
