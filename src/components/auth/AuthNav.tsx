"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "./AuthModalProvider";
import { logout } from "@/lib/auth-actions";

export default function AuthNav({ name }: { name: string | null }) {
  const { open } = useAuthModal();
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!name) {
    return (
      <button onClick={() => open("login")} className="flex flex-col items-center gap-0.5 text-[11px] text-ink/70">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/me" className="flex flex-col items-center gap-0.5 text-[11px] text-ink/70">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        내정보
      </Link>
      <button
        onClick={() => start(async () => { await logout(); router.refresh(); })}
        disabled={pending}
        className="text-[11px] text-sub hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
