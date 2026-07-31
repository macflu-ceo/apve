import Link from "next/link";
import { notFound } from "next/navigation";
import { parseList } from "@/lib/format";
import { getSessionPartner } from "@/lib/auth";
import { getCommunityPost, categoryLabel, displayAuthor } from "@/lib/community";
import DeletePostButton from "./DeletePostButton";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  const s = new Date(d.getTime() + 9 * 3600_000).toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`;
}

export default async function CommunityDetail({ params }: { params: { id: string } }) {
  const [post, partner] = await Promise.all([getCommunityPost(params.id), getSessionPartner()]);
  if (!post || post.hidden) notFound();
  const images = parseList(post.imagesJson);
  const mine = partner?.id === post.partnerId;

  return (
    <div className="px-4 pb-24 pt-6">
      <Link href="/community" className="text-sm text-sub hover:text-ink">← 커뮤니티</Link>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="rounded bg-brandsoft px-2 py-0.5 text-xs font-bold text-brand">{categoryLabel(post.category)}</span>
        {post.rewarded && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">20% 인증</span>}
      </div>
      <h1 className="mt-2 text-xl font-bold">{post.title}</h1>
      <div className="mt-1 text-sm text-sub">
        {displayAuthor(post.partner)} · {fmt(post.createdAt)}
      </div>

      <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</div>

      {images.length > 0 && (
        <div className="mt-5 space-y-3">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full rounded-xl2 object-cover" />
          ))}
        </div>
      )}

      {mine && (
        <div className="mt-6 border-t border-line pt-4">
          <DeletePostButton id={post.id} />
        </div>
      )}
    </div>
  );
}
