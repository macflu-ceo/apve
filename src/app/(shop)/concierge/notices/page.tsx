import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getConciergeViewer } from "@/lib/concierge-access";

export const dynamic = "force-dynamic";

export default async function ConciergeNoticesPage() {
  const c = await getConciergeViewer();
  if (!c) redirect("/concierge");

  const notices = await prisma.conciergeNotice.findMany({
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, pinned: true, filesJson: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/concierge" className="text-sm text-sub hover:text-ink">← 컨시어지 홈</Link>
      <h1 className="mt-2 text-2xl font-bold">컨시어지 공지</h1>
      <p className="mb-4 mt-1 text-sm text-sub">본사 공지·자료입니다.</p>

      {notices.length === 0 ? (
        <div className="card p-8 text-center text-sm text-sub">등록된 공지가 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {notices.map((n) => {
            const files = n.filesJson ? (JSON.parse(n.filesJson) as unknown[]).length : 0;
            return (
              <li key={n.id}>
                <Link href={`/concierge/notices/${n.id}`} className="card flex items-center justify-between gap-3 p-4 hover:bg-brandsoft">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink">
                      {n.pinned && <span className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">고정</span>}
                      {n.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-sub">
                      {new Date(n.createdAt.getTime() + 9 * 3600_000).toISOString().slice(0, 10)}
                      {files > 0 && <span className="ml-2 text-brand">📎 {files}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-ink/30">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
