import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { partnerLink } from "@/lib/godomall/link";
import RecommendSheet from "./RecommendSheet";

export const dynamic = "force-dynamic";

function firstImage(imagesJson: string | null): string | null {
  try {
    const arr = JSON.parse(imagesJson ?? "[]");
    return Array.isArray(arr) && arr[0] ? String(arr[0]) : null;
  } catch {
    return null;
  }
}

const won = (n: number) => n.toLocaleString() + "원";
const discount = (list: number | null, sale: number | null) =>
  list && sale && list > sale ? Math.round((1 - sale / list) * 100) : null;

async function getData(slug: string) {
  return prisma.multiLink.findUnique({
    where: { slug },
    include: {
      partner: { select: { code: true, name: true } },
      sections: { orderBy: [{ sort: "asc" }, { createdAt: "asc" }] },
      items: {
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
        include: { product: true },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const ml = await getData(params.slug);
  if (!ml || !ml.active) return { title: { absolute: "VIA ÉLITE" } };
  return {
    title: { absolute: `${ml.displayName}의 명품샵 | VIA ÉLITE` },
    description: ml.bio ?? "이탈리아 부티크 직계약 100% 정품, 특별한 가격으로 추천해드려요.",
    openGraph: {
      title: `${ml.displayName}의 명품샵`,
      description: ml.bio ?? "이탈리아 부티크 직계약, 100% 정품 명품을 특별한 가격으로.",
      ...(ml.avatarUrl ? { images: [ml.avatarUrl] } : {}),
    },
  };
}

export default async function MultiLinkPage({ params }: { params: { slug: string } }) {
  const ml = await getData(params.slug);
  if (!ml || !ml.active) notFound();

  // 조회수 (실패 무시)
  prisma.multiLink.update({ where: { id: ml.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const code = ml.partner.code ?? "";
  const items = ml.items.filter((i) => i.product.active);
  const groups = [
    ...ml.sections
      .map((s) => ({ key: s.id, title: s.title, rows: items.filter((i) => i.sectionId === s.id) }))
      .filter((g) => g.rows.length > 0),
    ...(items.some((i) => i.sectionId == null)
      ? [{ key: "default", title: ml.sections.length > 0 ? "추천 상품" : "", rows: items.filter((i) => i.sectionId == null) }]
      : []),
  ];

  const Card = ({ item }: { item: (typeof items)[number] }) => {
    const p = item.product;
    const img = firstImage(p.imagesJson);
    const d = discount(p.listPrice, p.salePrice);
    return (
      <a
        href={partnerLink(p.goodsNo, code)}
        target="_blank"
        rel="noopener"
        className={`block overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(20,30,80,.07)] transition active:scale-[0.98] `}
      >
        <div className="aspect-square bg-[#FAFAFC]">
          {img && <img src={img} alt={p.name} className="h-full w-full object-contain" loading="lazy" />}
        </div>
        <div className="p-3">
          {p.brand && <div className="text-[11px] font-semibold text-gray-400">{p.brand}</div>}
          <div className="mt-0.5 line-clamp-2 text-[12.5px] font-bold leading-snug text-gray-900">
            {p.name.replace(/^\[[^\]]*\]\s*/, "")}
          </div>
          <div className="mt-1.5 text-[14px] font-extrabold text-gray-900">
            {d != null && <span className="mr-1 text-[#13b6a6]">{d}%</span>}
            {p.salePrice != null && won(p.salePrice)}
          </div>
          {p.listPrice != null && d != null && (
            <div className="text-[11px] text-gray-300 line-through">{won(p.listPrice)}</div>
          )}
        </div>
      </a>
    );
  };

  return (
    <div className="min-h-dvh bg-[#F3F5FB]">
      <div className="mx-auto min-h-dvh max-w-[430px] bg-[#F3F5FB] pb-32">
        {/* ── 프로필 헤더 ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#4A60FF] to-[#6E82FF] px-5 pb-16 pt-10 text-center text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-white/10" />
          {ml.avatarUrl ? (
            <img src={ml.avatarUrl} alt="" className="mx-auto h-20 w-20 rounded-full border-[3px] border-white/80 object-cover shadow-lg" />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/80 bg-white text-3xl shadow-lg">🛍️</div>
          )}
          <div className="mt-3 text-[10px] font-bold tracking-[0.28em] text-white/70">VIA ÉLITE · ITALY DIRECT</div>
          <h1 className="mt-1 text-[21px] font-extrabold tracking-tight">{ml.displayName}의 명품샵</h1>
          {ml.bio && <p className="mx-auto mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-white/85">{ml.bio}</p>}
          <div className="mt-3.5 flex justify-center gap-1.5">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur">🛡️ 100% 정품 보증</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur">✈️ 이탈리아 부티크 직계약</span>
          </div>
        </div>

        {/* ── 정품 보증 카드 (디폴트) ── */}
        <div className="relative z-10 -mt-8 px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(20,30,80,.1)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-xl">🛡️</div>
            <div>
              <div className="text-[13.5px] font-extrabold text-gray-900">정품이 아니면 200% 보상</div>
              <div className="text-[11.5px] text-gray-500">이탈리아 부티크 직계약 공급 · VIA ÉLITE 정품 보증</div>
            </div>
          </div>
        </div>

        {/* ── 진열 섹션 ── */}
        {groups.map((g, gi) => (
          <div key={g.key} className="mt-7 px-4">
            {g.title && (
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-[17px] font-extrabold text-gray-900">{g.title}</h2>
                {gi === 0 && <span className="text-[11px] text-gray-400">{ml.displayName} PICK</span>}
              </div>
            )}
            <div className={g.title ? "mt-3 grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
              {g.rows.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="mt-16 text-center text-sm text-gray-400">아직 등록된 상품이 없어요.</div>
        )}

        {/* ── 푸터 ── */}
        <div className="mt-12 px-4 text-center">
          <div className="text-[12px] font-bold tracking-[0.22em] text-gray-400">VIA ÉLITE</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
            이탈리아 부티크 직계약 · 100% 정품 보증
          </p>
          <p className="mt-4 text-[9px] text-gray-300">powered by cashboutique</p>
        </div>

        <RecommendSheet slug={ml.slug} conciergeName={ml.displayName} />
      </div>
    </div>
  );
}
