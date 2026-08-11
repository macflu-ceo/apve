"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { forceDeletePartner } from "./actions";

export default function ForceDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm(`'${name}' 회원을 강제 탈퇴할까요?\n개인정보가 즉시 파기되고 로그인이 차단됩니다. (복구 불가)`)) return;
        start(async () => {
          await forceDeletePartner(id);
          router.refresh();
        });
      }}
      disabled={pending}
      className="text-[10px] text-red-400 hover:text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "…" : "강제탈퇴"}
    </button>
  );
}
