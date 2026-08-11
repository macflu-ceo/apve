"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type StoreInput = { name: string; code: string; address: string; hours: string; mapUrl: string; pin: string };

export async function saveStore(id: string | null, input: StoreInput) {
  const code = input.code.trim().toLowerCase();
  if (!input.name.trim() || !code) return { ok: false, message: "매장명과 코드는 필수입니다." };
  if (!/^[a-z]{2}$/.test(code)) return { ok: false, message: "매장 코드는 영문 2자리입니다 (예: cd)." };

  const data = {
    name: input.name.trim(),
    code,
    address: input.address.trim() || null,
    hours: input.hours.trim() || null,
    mapUrl: input.mapUrl.trim() || null,
    ...(input.pin.trim() ? { pinHash: hashPassword(input.pin.trim()) } : {}),
  };
  try {
    if (id) await prisma.store.update({ where: { id }, data });
    else await prisma.store.create({ data });
    revalidatePath("/admin/concierge-stores");
    return { ok: true, message: "저장했습니다." };
  } catch {
    return { ok: false, message: "코드가 중복되었을 수 있습니다." };
  }
}
