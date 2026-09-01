"use server";

import { prisma } from "@/lib/db";

/** 멀티링크 '추천받기' 신청 저장 — 고객이 남기는 DB */
export async function submitRecommendLead(input: {
  slug: string;
  name: string;
  phone: string;
  brands: string[];
  categories: string[];
  ageRange: string;
  gender: string;
  budget: string;
  sizes: string;
  memo: string;
}) {
  const name = input.name.trim();
  const phone = input.phone.trim().replace(/[^0-9-]/g, "");
  if (!name) return { ok: false, message: "이름을 입력해주세요." };
  if (phone.replace(/-/g, "").length < 10) return { ok: false, message: "연락처를 정확히 입력해주세요." };

  const ml = await prisma.multiLink.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (!ml) return { ok: false, message: "페이지를 찾을 수 없습니다." };

  // 같은 번호 중복 신청 방지 (멀티링크당 1회, 다시 남기면 갱신)
  const clip = (v: string, n = 120) => (v ? v.slice(0, n) : null);
  const existing = await prisma.recommendLead.findFirst({ where: { multiLinkId: ml.id, phone } });
  const data = {
    name: name.slice(0, 30),
    phone: phone.slice(0, 20),
    brands: clip(input.brands.join(", "), 200),
    categories: clip(input.categories.join(", "), 120),
    ageRange: clip(input.ageRange, 20),
    gender: clip(input.gender, 10),
    budget: clip(input.budget, 30),
    sizes: clip(input.sizes, 80),
    memo: clip(input.memo, 500),
  };
  if (existing) {
    await prisma.recommendLead.update({ where: { id: existing.id }, data: { ...data, status: "new" } });
  } else {
    await prisma.recommendLead.create({ data: { multiLinkId: ml.id, ...data } });
  }
  return { ok: true, message: "신청 완료! 컨시어지가 곧 연락드릴게요." };
}
