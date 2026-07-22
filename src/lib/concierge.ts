import { prisma } from "@/lib/db";

/** 기본 추가 문항 (없을 때 1회 생성) */
const DEFAULT_QUESTIONS = [
  { label: "명품 판매 경험이 있으신가요?", type: "select", optionsJson: JSON.stringify(["없음", "1년 미만", "1~3년", "3년 이상"]), required: true, sort: 0 },
  { label: "주로 활동하실 채널은?", type: "select", optionsJson: JSON.stringify(["지인 소개", "인스타그램", "카카오톡", "오프라인 매장", "기타"]), required: true, sort: 1 },
  { label: "월 예상 활동 시간은?", type: "select", optionsJson: JSON.stringify(["10시간 미만", "10~40시간", "40시간 이상"]), required: false, sort: 2 },
  { label: "지원 동기나 하고 싶은 말씀", type: "textarea", optionsJson: null, required: false, sort: 3 },
];

export async function ensureDefaultQuestions() {
  const count = await prisma.conciergeQuestion.count();
  if (count > 0) return;
  await prisma.conciergeQuestion.createMany({ data: DEFAULT_QUESTIONS });
}

export async function listActiveQuestions() {
  await ensureDefaultQuestions();
  return prisma.conciergeQuestion.findMany({
    where: { active: true },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
  });
}
