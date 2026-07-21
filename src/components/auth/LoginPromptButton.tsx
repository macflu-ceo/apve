"use client";

import { useAuthModal } from "./AuthModalProvider";

export default function LoginPromptButton() {
  const { open } = useAuthModal();
  return (
    <button onClick={() => open("login")} className="btn-brand mt-3">
      로그인 / 회원가입
    </button>
  );
}
