"use client";

import { useTransition } from "react";
import { deleteMyCommunityPost } from "../actions";

export default function DeletePostButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("이 글을 삭제할까요?")) return;
        start(async () => {
          await deleteMyCommunityPost(id);
        });
      }}
      className="text-sm text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "삭제 중…" : "글 삭제"}
    </button>
  );
}
