import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getConciergeViewer } from "@/lib/concierge-access";

export const dynamic = "force-dynamic";

type NFile = { name: string; url: string; size: number };

function fmtSize(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

export default async function ConciergeNoticeDetail({ params }: { params: { id: string } }) {
  const c = await getConciergeViewer();
  if (!c) redirect("/concierge");

  const n = await prisma.conciergeNotice.findFirst({ where: { id: params.id, published: true } });
  if (!n) notFound();

  const images: string[] = n.imagesJson ? JSON.parse(n.imagesJson) : [];
  const files: NFile[] = n.filesJson ? JSON.parse(n.filesJson) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/concierge/notices" className="text-sm text-sub hover:text-ink">← 공지 목록</Link>
      <h1 className="mt-2 text-2xl font-bold">{n.title}</h1>
      <div className="mt-1 text-xs text-sub">
        {new Date(n.createdAt.getTime() + 9 * 3600_000).toISOString().slice(0, 10)}
      </div>

      <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{n.content}</div>

      {images.length > 0 && (
        <div className="mt-5 space-y-3">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full rounded-xl2" />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-sm font-bold">첨부파일</div>
          <ul className="space-y-1.5">
            {files.map((f, i) => (
              <li key={i}>
                <a
                  href={f.url}
                  download={f.name}
                  target="_blank"
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-brandsoft"
                >
                  <span className="min-w-0 flex-1 truncate">📎 {f.name}</span>
                  <span className="shrink-0 text-xs text-sub">{fmtSize(f.size)}</span>
                  <span className="shrink-0 text-xs font-bold text-brand">다운로드</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
