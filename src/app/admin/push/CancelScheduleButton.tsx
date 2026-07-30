"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelScheduledPush } from "./actions";

export default function CancelScheduleButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("이 예약을 취소할까요?")) return;
        start(async () => {
          await cancelScheduledPush(id);
          router.refresh();
        });
      }}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "취소 중…" : "취소"}
    </button>
  );
}
