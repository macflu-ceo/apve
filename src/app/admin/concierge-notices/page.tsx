import { prisma } from "@/lib/db";
import NoticeForm from "./NoticeForm";
import DeleteButton from "./DeleteButton";
import type { NoticeFile } from "./actions";

export const dynamic = "force-dynamic";

function parseFiles(json: string | null): NoticeFile[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export default async function ConciergeNoticesPage() {
  const notices = await prisma.conciergeNotice.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">컨시어지 전용 공지</h1>
      <p className="mb-5 text-sm text-sub">컨시어지에게만 보이는 공지입니다. 첨부파일은 다운로드할 수 있습니다.</p>

      <div className="card mb-6 p-5">
        <h2 className="mb-3 text-base font-bold">새 공지 작성</h2>
        <NoticeForm />
      </div>

      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="card p-6 text-sm text-sub">등록된 공지가 없습니다.</div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">
                  {n.pinned && <span className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">고정</span>}
                  {n.title}
                </div>
                <DeleteButton id={n.id} />
              </div>
              <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-sub">{n.content}</p>
              {parseFiles(n.filesJson).length > 0 && (
                <div className="mt-1 text-xs text-brand">첨부 {parseFiles(n.filesJson).length}개</div>
              )}
              <div className="mt-1 text-[11px] text-sub">
                {new Date(n.createdAt.getTime() + 9 * 3600_000).toISOString().slice(0, 16).replace("T", " ")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
