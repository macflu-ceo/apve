"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

function revalidate() {
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}

function toDate(v: string) {
  const s = String(v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createPopup(input: {
  title: string;
  imageUrl: string;
  linkUrl: string;
  startAt: string;
  endAt: string;
}) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  if (!input.imageUrl.trim()) return { ok: false, message: "이미지를 등록하세요." };
  await prisma.popup.create({
    data: {
      title: input.title.trim() || "팝업",
      imageUrl: input.imageUrl.trim(),
      linkUrl: input.linkUrl.trim() || null,
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
    },
  });
  revalidate();
  return { ok: true, message: "팝업이 추가되었습니다." };
}

export async function updatePopup(
  id: string,
  input: { title: string; linkUrl: string; active: boolean; sort: number; startAt: string; endAt: string }
) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.popup.update({
    where: { id },
    data: {
      title: input.title.trim() || "팝업",
      linkUrl: input.linkUrl.trim() || null,
      active: input.active,
      sort: input.sort,
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
    },
  });
  revalidate();
  return { ok: true, message: "저장되었습니다." };
}

export async function deletePopup(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.popup.delete({ where: { id } });
  revalidate();
  return { ok: true, message: "삭제되었습니다." };
}
