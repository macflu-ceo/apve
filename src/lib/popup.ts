import { prisma } from "@/lib/db";

/** 현재 노출 기간에 해당하는 활성 팝업 (정렬순) */
export async function getActivePopups() {
  const now = new Date();
  const rows = await prisma.popup.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((p) => ({ id: p.id, title: p.title, imageUrl: p.imageUrl, linkUrl: p.linkUrl }));
}
