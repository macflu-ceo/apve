import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <Link href="/admin/posts" className="text-xs text-sub underline">← 게시판</Link>
        <Link href={`/board/${post.id}`} target="_blank" className="text-xs text-brand underline">미리보기 ↗</Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">게시글 수정</h1>
      <div className="card p-5">
        <PostForm
          post={{
            id: post.id,
            category: post.category,
            title: post.title,
            content: post.content,
            videoUrl: post.videoUrl,
            images: parseList(post.imagesJson),
            pinned: post.pinned,
          }}
        />
      </div>
    </div>
  );
}
