import { prisma } from "@/lib/db";
import { DAILY_LIMIT, kstMidnight } from "@/lib/ai/quota";

export const dynamic = "force-dynamic";

export default async function AdminAiImages() {
  const since = kstMidnight();

  const [images, todayCount, totalCount, topUsers] = await Promise.all([
    prisma.tryOnImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        product: { select: { goodsNo: true, name: true, brand: true } },
        partner: { select: { name: true, username: true, code: true } },
      },
    }),
    prisma.tryOnImage.count({ where: { createdAt: { gte: since } } }),
    prisma.tryOnImage.count(),
    prisma.tryOnImage.groupBy({
      by: ["partnerId"],
      _count: { partnerId: true },
      orderBy: { _count: { partnerId: "desc" } },
      take: 5,
      where: { createdAt: { gte: since } },
    }),
  ]);

  const heavy = await Promise.all(
    topUsers
      .filter((u) => u.partnerId)
      .map(async (u) => {
        const p = await prisma.partner.findUnique({
          where: { id: u.partnerId! },
          select: { name: true, username: true },
        });
        return { name: p?.name ?? "-", username: p?.username ?? "-", count: u._count.partnerId };
      })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-2xl font-bold">AI 생성 이미지</h1>
        <p className="text-sm text-sub">
          회원이 생성한 AI 이미지입니다. <b>쇼핑몰에는 노출되지 않으며</b> 회원 본인 다운로드용입니다.
          <br />
          제한: 1인 하루 {DAILY_LIMIT}장 (한국시간 자정 초기화) · 소진 후 1시간당 1장
        </p>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <div className="text-xs text-sub">오늘 생성</div>
          <div className="mt-2 text-xl font-bold">{todayCount.toLocaleString()}장</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-sub">전체 누적</div>
          <div className="mt-2 text-xl font-bold">{totalCount.toLocaleString()}장</div>
        </div>
        <div className="card col-span-2 p-5">
          <div className="mb-1 text-xs text-sub">오늘 많이 쓴 회원</div>
          {heavy.length === 0 ? (
            <div className="text-sm text-sub">-</div>
          ) : (
            <div className="space-y-0.5 text-sm">
              {heavy.map((h) => (
                <div key={h.username} className="flex justify-between">
                  <span>{h.name} <span className="text-xs text-sub">@{h.username}</span></span>
                  <span className={`font-bold ${h.count >= DAILY_LIMIT ? "text-red-500" : "text-brand"}`}>
                    {h.count}/{DAILY_LIMIT}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 이미지 목록 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">최근 생성 ({images.length})</h2>
        {images.length === 0 ? (
          <div className="card p-6 text-sm text-sub">아직 생성된 이미지가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {images.map((im) => (
              <div key={im.id} className="card overflow-hidden">
                <a href={im.imageUrl} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
                </a>
                <div className="space-y-1 p-2 text-xs">
                  <div className="truncate font-medium">{im.product.name}</div>
                  <div className="text-sub">{im.product.brand ?? "-"} · #{im.product.goodsNo}</div>
                  <div className="truncate text-sub">{im.prompt ?? "-"}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="truncate text-brand">
                      {im.partner ? `${im.partner.name}(@${im.partner.username})` : "알 수 없음"}
                    </span>
                    <span className="shrink-0 text-sub">{im.createdAt.toISOString().slice(5, 10)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
