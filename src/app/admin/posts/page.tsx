import { prisma } from "@/lib/db";
import PostForm from "./PostForm";
import PostRow from "./PostRow";

export const dynamic = "force-dynamic";

export default async function AdminPosts() {
  const posts = await prisma.post.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">공지/가이드 게시판</h1>
      <p className="mb-5 text-sm text-sub">공지·가이드 글을 등록합니다. 동영상(YouTube/Vimeo) 임베드를 넣을 수 있어요.</p>

      <div className="card mb-8 p-5">
        <div className="mb-3 text-sm font-bold">새 글 작성</div>
        <PostForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">게시글 ({posts.length})</h2>
      {posts.length === 0 ? (
        <div className="card p-6 text-sm text-sub">등록된 글이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <PostRow
              key={p.id}
              p={{
                id: p.id,
                category: p.category,
                title: p.title,
                pinned: p.pinned,
                published: p.published,
                createdAt: p.createdAt.toISOString().slice(0, 10),
                hasVideo: !!p.videoUrl,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
