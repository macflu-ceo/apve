import Link from "next/link";
import { won, parseList } from "@/lib/format";
import { getViewerRate } from "@/lib/grade";
import { getTimeSaleForShop } from "@/lib/timesale";
import TimeSaleCountdown from "./TimeSaleCountdown";

export const dynamic = "force-dynamic";

export default async function TimeSalePage() {
  const [data, rate] = await Promise.all([getTimeSaleForShop(), getViewerRate()]);

  if (!data || data.state === "off") {
    return (
      <div className="px-4 py-16 text-center text-sub">
        진행 중이거나 예정된 골든타임이 없습니다.
        <br />
        <Link href="/" className="mt-2 inline-block text-xs text-brand underline">홈으로</Link>
      </div>
    );
  }

  const { ts, items, state } = data;
  const upcoming = state === "upcoming";

  return (
    <div className="px-4 py-6">
      {/* 히어로 */}
      <div
        className="mb-6 rounded-xl2 p-6 text-center text-white"
        style={{
          backgroundImage: upcoming
            ? "linear-gradient(135deg, #2b2622, #4a3f36)"
            : `linear-gradient(135deg, ${ts.colorFrom}, ${ts.colorTo})`,
        }}
      >
        <div className="text-2xl font-black tracking-tight">{ts.title}</div>
        <div className="mt-1 text-sm font-semibold text-white/85">
          {upcoming ? ts.upcomingText : ts.liveText}
        </div>
        <div className="mt-4">
          <TimeSaleCountdown
            state={state}
            startAt={ts.startAt?.toISOString() ?? null}
            endAt={ts.endAt?.toISOString() ?? null}
          />
        </div>
      </div>

      {upcoming ? (
        <div className="rounded-xl2 border border-line bg-[#faf9f8] p-10 text-center">
          <div className="text-lg font-black">🔒 오픈 준비 중</div>
          <p className="mt-2 text-sm text-sub">
            오픈되면 이 상품들을 팔 때 <b className="text-[#9a6f08]">수수료가 올라갑니다.</b>
            <br />
            타이머가 끝나면 자동으로 시작됩니다.
          </p>
          <div className="mt-4 text-xs text-sub">준비된 상품 {items.length}개</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map(({ product: p, boost }) => {
            const img = parseList(p.imagesJson)[0];
            const base = p.salePrice != null ? Math.round((p.salePrice * rate.percent) / 100) : null;
            const boosted =
              p.salePrice != null ? Math.round((p.salePrice * (rate.percent + boost)) / 100) : null;
            return (
              <Link key={p.id} href={`/goods/${p.goodsNo}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 bg-[#f5f4f2]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sub">No Image</div>
                  )}
                  {boost > 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-[#9a6f08] px-2 py-1 text-xs font-black text-white">
                      수수료 +{boost}%p
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  {p.brand && <div className="text-xs font-bold text-brand">{p.brand}</div>}
                  <div className="line-clamp-1 text-sm">{p.name}</div>
                  <div className="mt-1 text-sm font-extrabold">{won(p.salePrice)}</div>
                  {boosted != null && rate.percent > 0 && (
                    <div className="mt-0.5 text-[11px] text-sub">
                      수수료{" "}
                      {base != null && boost > 0 && (
                        <span className="text-sub line-through">{won(base)}</span>
                      )}{" "}
                      <b className="text-[#9a6f08]">{won(boosted)}</b>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
