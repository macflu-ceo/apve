import { prisma } from "@/lib/db";
import PopupManager from "./PopupManager";

export const dynamic = "force-dynamic";

export default async function AdminPopups() {
  const popups = await prisma.popup.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">팝업 관리</h1>
      <p className="mb-6 text-sm text-sub">
        소비자 화면 가운데에 뜨는 팝업입니다. 이미지 + 링크로 만들고, 여러 개면 넘겨볼 수 있으며 “오늘 하루 보지 않기”가 지원됩니다.
      </p>
      <PopupManager
        popups={popups.map((p) => ({
          id: p.id,
          title: p.title,
          imageUrl: p.imageUrl,
          linkUrl: p.linkUrl,
          active: p.active,
          sort: p.sort,
          platform: p.platform,
          startAt: p.startAt?.toISOString() ?? null,
          endAt: p.endAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
