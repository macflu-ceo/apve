import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">공지 / 가이드</h1>
      <p className="mb-5 text-sm text-sub">돈버는명품샵의 공지사항과 판매 가이드</p>

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
