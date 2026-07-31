import Link from "next/link";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { getSessionPartner } from "@/lib/auth";
import { getCommunityPosts, getActiveCommunityCategories, categoryLabelMap, displayAuthor } from "@/lib/community";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  const s = new Date(d.getTime() + 9 * 3600_000).toISOString();
  return `${s.slice(5, 10)}`;
}

export default async function CommunityPage({ searchParams }: { searchParams: { cat?: string } }) {
  const cat = searchParams.cat;
  const [posts, pinned, partner, categories, labels] = await Promise.all([
    getCommunityPosts(cat, 60),
    prisma.post.findMany({ where: { pinned: true, published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    getSessionPartner(),
    getActiveCommunityCategories(),
    categoryLabelMap(),
  ]);
  const canWrite = partner?.status === "approved";
  const catLabel = (k: string) => labels.get(k) ?? k;

  return (
    <div className="px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        {canWrite ? (
          <Link href="/community/new" className="btn-brand px-4 py-2 text-sm">글쓰기</Link>
        ) : (
          <span className="text-xs text-sub">승인된 회원만 작성 가능</span>
        )}
      </div>

      {/* 상단 고정 공지/가이드 (게시판은 별도 운영) */}
      {pinned.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {pinned.map((p) => (
            <Link
              key={p.id}
              href={`/board/${p.id}`}
              className="flex items-center gap-2 rounded-lg border border-line bg-[#fbfaf9] px-3 py-2 text-sm hover:border-ink/20"
            >
              <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">{p.category}</span>
              <span className="line-clamp-1 flex-1">{p.title}</span>
              <span className="text-brand">📌</span>
            </Link>
          ))}
        </div>
      )}

      {/* 카테고리 탭 (2개 이상일 때만 노출) */}
      {categories.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Tab active={!cat} href="/community" label="전체" />
          {categories.map((c) => (
            <Tab key={c.key} active={cat === c.key} href={`/community?cat=${c.key}`} label={c.label} />
          ))}
        </div>
      )}

      {/* 목록 */}
      {posts.length === 0 ? (
        <div className="card p-10 text-center text-sm text-sub">
          아직 글이 없어요. {canWrite && "첫 글을 남겨보세요!"}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => {
            const imgs = parseList(p.imagesJson);
            return (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="flex gap-3 rounded-xl2 border border-line bg-white p-3 hover:border-ink/20"
              >
                {imgs[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgs[0]} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {p.pinned && <span className="text-brand">📌</span>}
                    <span className="rounded bg-brandsoft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                      {catLabel(p.category)}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-1 font-medium">{p.title}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-sub">{p.content}</div>
                  <div className="mt-1 text-[11px] text-sub">
                    {displayAuthor(p.partner)} · {fmt(p.createdAt)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tab({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
        active ? "border-brand bg-brand text-white" : "border-line text-ink/70 hover:border-ink/30"
      }`}
    >
      {label}
    </Link>
  );
}
