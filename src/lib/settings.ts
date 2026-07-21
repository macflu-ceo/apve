import { prisma } from "@/lib/db";

/** 사이트 설정을 가져온다. 없으면 기본값으로 생성. */
export async function getSiteSetting() {
  return prisma.siteSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" },
  });
}
