"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

type PostInput = {
  category: string;
  title: string;
  content: string;
  videoUrl: string;
  images: string[];
  pinned: boolean;
};

export async function createPost(input: PostInput) {
  if (!input.title.trim()) return { ok: false, message: "제목을 입력하세요." };
  const post = await prisma.post.create({
    data: {
      category: input.category || "공지",
      title: input.title.trim(),
      content: input.content,
      imagesJson: JSON.stringify(input.images ?? []),
      videoUrl: input.videoUrl.trim() || null,
      pinned: input.pinned,
    },
  });
  revalidatePath("/admin/posts");
  revalidatePath("/board");
  return { ok: true, message: "등록되었습니다.", id: post.id };
}

export async function updatePost(id: string, input: PostInput) {
  await prisma.post.update({
    where: { id },
    data: {
      category: input.category || "공지",
      title: input.title.trim(),
      content: input.content,
      imagesJson: JSON.stringify(input.images ?? []),
      videoUrl: input.videoUrl.trim() || null,
      pinned: input.pinned,
    },
  });
  revalidatePath("/admin/posts");
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
  return { ok: true, message: "저장되었습니다." };
}

export async function togglePostPublished(id: string, published: boolean) {
  await prisma.post.update({ where: { id }, data: { published } });
  revalidatePath("/admin/posts");
  revalidatePath("/board");
}

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/posts");
  revalidatePath("/board");
}

/** 공지 상단고정 토글 — 커뮤니티/공지 목록 상단에 📌 고정 */
export async function togglePostPinned(id: string, pinned: boolean) {
  await prisma.post.update({ where: { id }, data: { pinned } });
  revalidatePath("/admin/posts");
  revalidatePath("/board");
  revalidatePath("/community");
}
