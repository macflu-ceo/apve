"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionPartner } from "@/lib/auth";


/** 짧은 멀티링크 주소(4자리) 생성 — 혼동 문자(l,1,o,0,i) 제외 */
async function generateShortSlug(): Promise<string> {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  for (let attempt = 0; attempt < 20; attempt++) {
    let s = "";
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    const dup = await prisma.multiLink.findUnique({ where: { slug: s }, select: { id: true } });
    if (!dup) return s;
  }
  throw new Error("슬러그 생성 실패");
}

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
        slug: await generateShortSlug(),
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
  coverUrl?: string;
  featuredTitle?: string;
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
      coverUrl: (input.coverUrl ?? "").trim() || null,
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

// ── 진열 섹션 관리 ──
export async function createSection(title: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const t = title.trim().slice(0, 20);
  if (!t) return { ok: false, message: "섹션 이름을 입력하세요." };
  const count = await prisma.multiLinkSection.count({ where: { multiLinkId: r.ml.id } });
  if (count >= 10) return { ok: false, message: "섹션은 최대 10개까지 만들 수 있어요." };
  const max = await prisma.multiLinkSection.aggregate({ where: { multiLinkId: r.ml.id }, _max: { sort: true } });
  await prisma.multiLinkSection.create({ data: { multiLinkId: r.ml.id, title: t, sort: (max._max.sort ?? 0) + 1 } });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function renameSection(sectionId: string, title: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const t = title.trim().slice(0, 20);
  if (!t) return { ok: false, message: "섹션 이름을 입력하세요." };
  await prisma.multiLinkSection.updateMany({ where: { id: sectionId, multiLinkId: r.ml.id }, data: { title: t } });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function deleteSection(sectionId: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  await prisma.multiLinkSection.deleteMany({ where: { id: sectionId, multiLinkId: r.ml.id } }); // 상품은 기본 진열로 이동(SetNull)
  refresh(r.ml.slug);
  return { ok: true };
}

export async function moveSection(sectionId: string, dir: "up" | "down") {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const secs = await prisma.multiLinkSection.findMany({
    where: { multiLinkId: r.ml.id },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const idx = secs.findIndex((x) => x.id === sectionId);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= secs.length) return { ok: true };
  const order = secs.map((x) => x.id);
  [order[idx], order[swap]] = [order[swap], order[idx]];
  await prisma.$transaction(order.map((id, i) => prisma.multiLinkSection.update({ where: { id }, data: { sort: i + 1 } })));
  refresh(r.ml.slug);
  return { ok: true };
}

export async function setItemSection(itemId: string, sectionId: string | null) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  if (sectionId) {
    const sec = await prisma.multiLinkSection.findFirst({ where: { id: sectionId, multiLinkId: r.ml.id } });
    if (!sec) return { ok: false, message: "섹션이 없습니다." };
  }
  await prisma.multiLinkItem.updateMany({ where: { id: itemId, multiLinkId: r.ml.id }, data: { sectionId } });
  refresh(r.ml.slug);
  return { ok: true };
}

// ── 이미지 배너(기획전) 관리 ──
export async function addBanner(input: { imageUrl: string; title: string; sectionId: string | null }) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  if (!input.imageUrl.trim()) return { ok: false, message: "배너 이미지를 올려주세요." };
  const count = await prisma.multiLinkBanner.count({ where: { multiLinkId: r.ml.id } });
  if (count >= 5) return { ok: false, message: "배너는 최대 5개까지 만들 수 있어요." };
  const max = await prisma.multiLinkBanner.aggregate({ where: { multiLinkId: r.ml.id }, _max: { sort: true } });
  await prisma.multiLinkBanner.create({
    data: {
      multiLinkId: r.ml.id,
      imageUrl: input.imageUrl.trim(),
      title: input.title.trim().slice(0, 30) || null,
      sectionId: input.sectionId,
      sort: (max._max.sort ?? 0) + 1,
    },
  });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function updateBanner(bannerId: string, input: { title: string; sectionId: string | null }) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  await prisma.multiLinkBanner.updateMany({
    where: { id: bannerId, multiLinkId: r.ml.id },
    data: { title: input.title.trim().slice(0, 30) || null, sectionId: input.sectionId },
  });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function deleteBanner(bannerId: string) {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  await prisma.multiLinkBanner.deleteMany({ where: { id: bannerId, multiLinkId: r.ml.id } });
  refresh(r.ml.slug);
  return { ok: true };
}

export async function moveBanner(bannerId: string, dir: "up" | "down") {
  const r = await myMultiLink();
  if ("error" in r) return { ok: false, message: r.error };
  const rows = await prisma.multiLinkBanner.findMany({
    where: { multiLinkId: r.ml.id },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  const idx = rows.findIndex((x) => x.id === bannerId);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return { ok: true };
  const order = rows.map((x) => x.id);
  [order[idx], order[swap]] = [order[swap], order[idx]];
  await prisma.$transaction(order.map((id, i) => prisma.multiLinkBanner.update({ where: { id }, data: { sort: i + 1 } })));
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
