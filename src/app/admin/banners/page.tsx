import { prisma } from "@/lib/db";
import BannerForm from "./BannerForm";
import BannerRow from "./BannerRow";

export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const banners = await prisma.banner.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">배너 관리</h1>

      <div className="card mb-8 p-5">
        <BannerForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">등록된 배너 ({banners.length})</h2>
      {banners.length === 0 ? (
        <div className="card p-6 text-sm text-sub">등록된 배너가 없습니다. 없으면 홈은 기본 배너를 보여줍니다.</div>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <BannerRow key={b.id} banner={b} />
          ))}
        </div>
      )}
    </div>
  );
}
