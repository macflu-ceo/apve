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
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {posts.map((p) => {
          const img = parseList(p.imagesJson)[0];
          return (
            <Link
              key={p.id}
              href={`/community/${p.id}`}
              className="w-40 shrink-0 overflow-hidden rounded-xl2 border border-line bg-white"
            >
              <div className="aspect-[4/3] w-full bg-[#f5f4f2]">
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-2.5">
                <div className="line-clamp-2 text-sm font-semibold leading-snug">{p.title}</div>
                <div className="mt-1 line-clamp-1 text-xs text-sub">{p.content}</div>
                <div className="mt-1.5 text-[11px] text-sub">{displayAuthor(p.partner)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
