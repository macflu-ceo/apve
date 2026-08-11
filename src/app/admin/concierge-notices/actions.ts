"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type NoticeFile = { name: string; url: string; size: number };
type Input = { title: string; content: string; images: string[]; files: NoticeFile[]; pinned: boolean };

function clean(input: Input) {
  return {
    title: input.title.trim(),
    content: input.content,
    imagesJson: input.images.length ? JSON.stringify(input.images) : null,
    filesJson: input.files.length ? JSON.stringify(input.files) : null,
    pinned: input.pinned,
  };
}

export async function createConciergeNotice(input: Input) {
  if (!input.title.trim()) return { ok: false, message: "제목을 입력하세요." };
  await prisma.conciergeNotice.create({ data: clean(input) });
  revalidatePath("/admin/concierge-notices");
  revalidatePath("/concierge/notices");
  return { ok: true, message: "공지를 등록했습니다." };
}

export async function updateConciergeNotice(id: string, input: Input) {
  if (!input.title.trim()) return { ok: false, message: "제목을 입력하세요." };
  await prisma.conciergeNotice.update({ where: { id }, data: clean(input) });
  revalidatePath("/admin/concierge-notices");
  revalidatePath("/concierge/notices");
  return { ok: true, message: "수정했습니다." };
}

export async function deleteConciergeNotice(id: string) {
  await prisma.conciergeNotice.delete({ where: { id } });
  revalidatePath("/admin/concierge-notices");
  revalidatePath("/concierge/notices");
  return { ok: true };
}
