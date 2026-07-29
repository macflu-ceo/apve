import { prisma } from "@/lib/db";
import { cache } from "react";

/**
 * 사이트 설정을 가져온다. (읽기 우선 — 매 요청 쓰기 방지)
 * 기존엔 매 페이지 로드마다 upsert(쓰기)를 해서 Neon 연결이 고갈됐다.
 * 이제 findUnique(읽기)만 하고, 행이 없을 때만 1회 생성한다. cache()로 요청당 1회 메모이즈.
 */
export const getSiteSetting = cache(async () => {
  const row = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  if (row) return row;
  // 최초 1회만 생성 (동시 생성 경쟁 시 재조회)
  try {
    return await prisma.siteSetting.create({ data: { id: "main" } });
  } catch {
    return prisma.siteSetting.findUniqueOrThrow({ where: { id: "main" } });
  }
});
