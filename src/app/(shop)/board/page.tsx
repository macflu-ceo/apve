import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category;
  const posts = await prisma.post.findMany({
    where: { published: true, ...(category ? { category } : {}) },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const title = category === "공지" ? "공지사항" : category === "가이드" ? "이용 가이드" : "공지 / 가이드";
  const desc =
    category === "공지"
      ? "돈버는명품샵의 공지사항"
      : category === "가이드"
      ? "판매를 시작하는 방법과 노하우"
      : "돈버는명품샵의 공지사항과 판매 가이드";

  return (
    <div className="px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">{title}</h1>
      <p className="mb-4 text-sm text-sub">{desc}</p>

      {/* 분류 탭 */}
      <div className="mb-5 flex gap-2 text-sm font-bold">
        {[
          { label: "전체", value: undefined },
          { label: "공지", value: "공지" },
          { label: "가이드", value: "가이드" },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.value ? `/board?category=${encodeURIComponent(t.value)}` : "/board"}
            className={`rounded-full px-3 py-1.5 ${
              category === t.value ? "bg-ink text-white" : "bg-[#f5f3f0] text-sub"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl2 bg-[#f7f7f7] p-12 text-center text-sub">등록된 글이 없습니다.</div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/board/${p.id}`} className="flex items-center gap-3 py-4 hover:bg-black/[0.02]">
                <span className="shrink-0 rounded bg-brandsoft px-2 py-0.5 text-xs font-bold text-brand">{p.category}</span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {p.pinned && <span className="mr-1 text-brand">📌</span>}
                  {p.videoUrl && <span className="mr-1">🎬</span>}
                  {p.imagesJson && p.imagesJson !== "[]" && <span className="mr-1">🖼</span>}
                  {p.title}
                </span>
                <span className="shrink-0 text-xs text-sub">{p.createdAt.toISOString().slice(0, 10)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
