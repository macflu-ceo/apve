"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteConciergeNotice } from "./actions";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("이 공지를 삭제할까요?")) return;
        start(async () => {
          await deleteConciergeNotice(id);
          router.refresh();
        });
      }}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      삭제
    </button>
  );
}
