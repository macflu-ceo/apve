"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";

/** 컨시어지 본인 확인 + 멀티링크 확보(없으면 생성) */
async function myMultiLink() {
  const partner = await getSessionPartner();
  if (!partner) return { error: "로그인이 필요합니다." as const };
  if (partner.conciergeNo == null) return { error: "컨시어지 전용 기능입니다." as const };
  let ml = await prisma.multiLink.findUnique({ where: { partnerId: partner.id } });
  if (!ml) {
    ml = await prisma.multiLink.create({
      data: {
        partnerId: partner.id,
        slug: (partner.code ?? partner.id.slice(-8)).toLowerCase(),
        displayName: partner.name,
      },
    });
  }
  return { partner, ml };
}

function refresh(slug: string) {
  revalidatePath("/me/multilink");
  revalidatePath(`/m/${slug}`);
}

export async function updateMultiLinkProfile(input: {
  displayName: string;
  bio: string;
  avatarUrl: string;
  featuredTitle: string;
}) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const displayName = input.displayName.trim().slice(0, 20);
  if (!displayName) return { ok: false, message: "이름을 입력하세요." };
  await prisma.multiLink.update({
    where: { id: r.ml.id },
    data: {
      displayName,
      bio: input.bio.trim().slice(0, 120) || null,
      avatarUrl: input.avatarUrl.trim() || null,
      featuredTitle: input.featuredTitle.trim().slice(0, 20) || "지금 추천해요",
    },
  });
  refresh(r.ml.slug);
  return { ok: true, message: "저장되었습니다." };
}

export async function addMultiLinkItem(productId: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const count = await prisma.multiLinkItem.count({ where: { multiLinkId: r.ml.id } });
  if (count >= 30) return { ok: false, message: "최대 30개까지 담을 수 있어요." };
  const max = await prisma.multiLinkItem.aggregate({ where: { multiLinkId: r.ml.id }, _max: { sort: true } });
  await prisma.multiLinkItem.upsert({
    where: { multiLinkId_productId: { multiLinkId: r.ml.id, productId } },
    update: {},
    create: { multiLinkId: r.ml.id, productId, sort: (max._max.sort ?? 0) + 1 },
  });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function removeMultiLinkItem(itemId: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  await prisma.multiLinkItem.deleteMany({ where: { id: itemId, multiLinkId: r.ml.id } });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function toggleMultiLinkFeatured(itemId: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const item = await prisma.multiLinkItem.findFirst({ where: { id: itemId, multiLinkId: r.ml.id } });
  if (!item) return { ok: false, message: "항목이 없습니다." };
  await prisma.multiLinkItem.update({ where: { id: item.id }, data: { featured: !item.featured } });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function moveMultiLinkItem(itemId: string, dir: "up" | "down") {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const items = await prisma.multiLinkItem.findMany({
    where: { multiLinkId: r.ml.id },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const idx = items.findIndex((i) => i.id === itemId);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= items.length) return { ok: true };
  // sort 값 전체 재부여 후 두 항목 교환 (초기 sort 중복 대비)
  const order = items.map((i) => i.id);
  [order[idx], order[swap]] = [order[swap], order[idx]];
  await prisma.$transaction(order.map((id, i) => prisma.multiLinkItem.update({ where: { id }, data: { sort: i + 1 } })));
  refresh(r.ml.slug);
  return { ok: true };
}

export async function setLeadStatus(leadId: string, status: "new" | "done") {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  await prisma.recommendLead.updateMany({ where: { id: leadId, multiLinkId: r.ml.id }, data: { status } });
  revalidatePath("/me/multilink");
  return { ok: true };
}
