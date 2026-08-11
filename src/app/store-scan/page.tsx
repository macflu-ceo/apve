import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { lookupCoupon } from "./actions";
import PinGate from "./PinGate";
import ScanConsole from "./ScanConsole";

export const dynamic = "force-dynamic";
export const metadata = { title: "매장 스캔 · VIA ÉLITE", robots: { index: false } };

export default async function StoreScanPage({ searchParams }: { searchParams: { c?: string } }) {
  const storeId = (await cookies()).get("store_scan")?.value;
  const store = storeId ? await prisma.store.findUnique({ where: { id: storeId } }) : null;
  if (!store) return <PinGate />;

  // QR로 진입 시 ?c= 로 바로 조회
  let initial = null;
  if (searchParams.c) {
    const r = await lookupCoupon(searchParams.c);
    if (r.ok) initial = r.coupon;
  }
  return <ScanConsole initial={initial} />;
}
