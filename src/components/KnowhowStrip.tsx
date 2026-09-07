import Link from "next/link";
import { parseList } from "@/lib/format";
import { displayAuthor } from "@/lib/community";

type Post = {
  id: string;
  title: string;
  content: string;
  imagesJson: string | null;
  partner: { nickname: string | null; name: string };
};

/** 홈 중간에 노출되는 최신 판매노하우 가로 미리보기 */
export default function KnowhowStrip({ posts, title = "최신 판매 노하우" }: { posts: Post[]; title?: string }) {
  if (posts.length === 0) return null;

  return (
    <section className="px-4 pb-10">
      <div className="mb-3 flex items-end justify-between">
        <div className="text-xl font-black">{title}</div>
        <Link href="/community" className="text-sm font-semibold text-brand hover:underline">
          더보기 →
        </Link>
      </div>
      {/* 글 대부분이 이미지가 없어서 카드형 대신 텍스트 리스트로.
          이미지가 있으면 앞에 작은 미리보기 썸네일만 붙는다. */}
      <div className="divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-white">
        {posts.slice(0, 5).map((p) => {
          const img = parseList(p.imagesJson)[0];
          return (
            <Link key={p.id} href={`/community/${p.id}`} className="flex items-center gap-3 px-3.5 py-3 active:bg-line/20">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold leading-snug">{p.title}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-sub">{p.content}</div>
              </div>
              <span className="shrink-0 text-[11px] text-sub">{displayAuthor(p.partner)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
