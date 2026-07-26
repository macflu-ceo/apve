"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { countAudience, resolveAudience, type CrmFilter } from "@/lib/crm/audience";
import { sendMessage, type MessageChannel } from "@/lib/crm/send";

/** 세그먼트 대상 수 (작성 화면 실시간 카운트) */
export async function getAudienceCount(filter: CrmFilter) {
  if (!isAdmin()) return 0;
  return countAudience(filter);
}

export interface SendInput {
  title: string;
  channel: MessageChannel;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  productId?: string;
  filter: CrmFilter;
}

/** 메시지 발송 (현재 mock — 이력 기록 + 대상 계산) */
export async function sendCampaign(input: SendInput) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  if (!input.content.trim()) return { ok: false, message: "본문을 입력하세요." };

  const targets = await resolveAudience(input.filter);
  const result = await sendMessage(
    {
      channel: input.channel,
      content: input.content,
      imageUrl: input.imageUrl || null,
      linkUrl: input.linkUrl || null,
    },
    targets.map((t) => ({ phone: t.phone, name: t.name, channelFriend: t.channelFriend }))
  );

  await prisma.crmMessage.create({
    data: {
      title: input.title.trim() || "제목 없음",
      channel: input.channel,
      content: input.content,
      imageUrl: input.imageUrl || null,
      linkUrl: input.linkUrl || null,
      productId: input.productId || null,
      filterJson: JSON.stringify(input.filter),
      status: result.sent > 0 || result.provider === "mock" ? "sent" : "failed",
      targetCount: result.requested,
      sentCount: result.sent,
      sentAt: new Date(),
    },
  });

  revalidatePath("/admin/crm");
  return { ok: true, ...result };
}

export async function deleteCampaign(id: string) {
  if (!isAdmin()) return { ok: false, message: "권한이 없습니다." };
  await prisma.crmMessage.delete({ where: { id } });
  revalidatePath("/admin/crm");
  return { ok: true, message: "삭제되었습니다." };
}
