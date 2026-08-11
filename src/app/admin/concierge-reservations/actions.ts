"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function setReservationStatus(id: string, status: "reserved" | "visited" | "noshow" | "canceled") {
  await prisma.couponReservation.update({ where: { id }, data: { status } });
  revalidatePath("/admin/concierge-reservations");
  return { ok: true };
}
