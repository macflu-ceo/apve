// 알림톡 자동 규칙 — 트리거 정의 + 기본 규칙
import { prisma } from "@/lib/db";

export type TriggerKey = "sale" | "commission" | "settlement" | "signup" | "weekly";

export const TRIGGERS: {
  key: TriggerKey;
  label: string;
  desc: string;
  /** 임계값 필요 여부 (금액/일수) */
  needsThreshold: boolean;
  thresholdLabel?: string;
  /** 사용 가능한 치환 변수 */
  vars: string[];
}[] = [
  { key: "sale", label: "판매 발생", desc: "내 코드로 판매가 일어났을 때 즉시", needsThreshold: false, vars: ["#{이름}", "#{상품}", "#{수수료}"] },
  { key: "commission", label: "수수료 도달", desc: "누적 수수료가 목표 금액에 도달했을 때", needsThreshold: true, thresholdLabel: "목표 금액(원)", vars: ["#{이름}", "#{누적수수료}"] },
  { key: "settlement", label: "정산 완료", desc: "수수료가 지급 처리됐을 때", needsThreshold: false, vars: ["#{이름}", "#{수수료}"] },
  { key: "signup", label: "가입 승인", desc: "회원 가입이 승인됐을 때", needsThreshold: false, vars: ["#{이름}"] },
  { key: "weekly", label: "주간 리포트", desc: "매주 개인 성과 요약 (조회·판매·수수료)", needsThreshold: false, vars: ["#{이름}", "#{건수}", "#{수수료}"] },
];

/** 기본 규칙 (최초 1회 생성) */
export const DEFAULT_RULES = [
  {
    name: "판매 발생 알림",
    trigger: "sale",
    segment: "all",
    threshold: null as number | null,
    message: "[돈버는 명품샵] #{이름}님의 코드로 상품이 판매되었어요! 🎉\n· 상품: #{상품}\n· 예상 수수료: #{수수료}원\n마이페이지에서 확인하세요.",
  },
  {
    name: "수수료 50만원 달성",
    trigger: "commission",
    segment: "all",
    threshold: 500_000,
    message: "[돈버는 명품샵] 축하합니다 🏆\n#{이름}님의 누적 수수료가 #{누적수수료}원을 돌파했어요! 이 기세로 계속 달려볼까요?",
  },
  {
    name: "정산 완료 알림",
    trigger: "settlement",
    segment: "all",
    threshold: null as number | null,
    message: "[돈버는 명품샵] #{이름}님, 수수료 정산이 완료되었습니다.\n· 지급 수수료: #{수수료}원\n감사합니다!",
  },
  {
    name: "가입 승인 환영",
    trigger: "signup",
    segment: "all",
    threshold: null as number | null,
    message: "[돈버는 명품샵] #{이름}님, 가입이 승인되었어요! 🎉\n이제 상품 코드를 만들어 판매를 시작할 수 있습니다.",
  },
];

export async function ensureDefaultRules() {
  const count = await prisma.alimtalkRule.count();
  if (count > 0) return;
  let sort = 0;
  for (const r of DEFAULT_RULES) {
    await prisma.alimtalkRule.create({ data: { ...r, sort: sort++ } });
  }
}

export async function listRules() {
  await ensureDefaultRules();
  return prisma.alimtalkRule.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
}

/** 변수 치환 */
export function render(template: string, vars: Record<string, string | number>): string {
  return template.replace(/#\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}
