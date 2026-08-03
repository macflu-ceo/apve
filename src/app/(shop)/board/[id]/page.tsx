import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { toEmbedUrl } from "@/lib/embed";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post || !post.published) return { title: "게시글" };
  const desc = post.content.replace(/<[^>]+>/g, "").slice(0, 150);
  const img = parseList(post.imagesJson)[0];
  return {
    title: post.title,
    description: desc,
    alternates: { canonical: `/board/${post.id}` },
    openGraph: { title: `${post.title} | 돈버는 명품샵`, description: desc, ...(img ? { images: [{ url: img }] } : {}) },
  };
}

export default async function BoardDetail({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post || !post.published) notFound();

  const embed = toEmbedUrl(post.videoUrl);
  const images = parseList(post.imagesJson);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/board" className="text-xs text-sub underline">← 목록</Link>

      <div className="mt-3 border-b border-line pb-4">
        <span className="rounded bg-brandsoft px-2 py-0.5 text-xs font-bold text-brand">{post.category}</span>
        <h1 className="mt-2 text-2xl font-bold">{post.title}</h1>
        <div className="mt-1 text-xs text-sub">{post.createdAt.toISOString().slice(0, 10)}</div>
      </div>

      {embed && (
        <div className="mt-5 aspect-video w-full overflow-hidden rounded-xl2">
          <iframe
            src={embed}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* 본문 이미지 (풀폭 스택 — 긴 통이미지). 이미지 먼저, 텍스트는 아래로. */}
      {images.length > 0 && (
        <div className="mt-5 space-y-2">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full rounded-lg" />
          ))}
        </div>
      )}

      {post.content && (
        <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/85">{post.content}</div>
      )}
    </div>
  );
}
