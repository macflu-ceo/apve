"use server";

import { checkAdmin, setAdminSession } from "@/lib/admin";

export async function adminLogin(user: string, password: string) {
  if (!checkAdmin(user, password)) {
    return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }
  setAdminSession();
  return { ok: true };
}
