// 사업자 정보 — 약관·개인정보처리방침·푸터에서 공통 참조
// 기본값(아래 COMPANY)을 두고, 어드민에서 저장한 SiteSetting 값으로 덮어쓴다.
import { prisma } from "@/lib/db";

export const COMPANY = {
  corpName: "주식회사 제이프리모인터내셔널",
  brand: "돈버는명품샵",
  ceo: "지준우",
  bizNo: "435-87-02485",
  mailOrderNo: "2024-서울강남-06628호",
  address: "서울특별시 강남구 테헤란로2길 27(역삼동) 908호",
  csPhone: "1533-1658",
  email: "info@jprimo.com",
  privacyOfficer: "이긍정",
  privacyEmail: "greg@jprimo.com",
  // 실제 상품 구매가 이루어지는 쇼핑몰
  shopUrl: "https://viaelite.co.kr",
  shopName: "비아엘리떼",
} as const;

export type Company = {
  corpName: string;
  brand: string;
  ceo: string;
  bizNo: string;
  mailOrderNo: string;
  address: string;
  csPhone: string;
  email: string;
  privacyOfficer: string;
  privacyEmail: string;
  shopUrl: string;
  shopName: string;
};

/** 어드민 설정을 반영한 사업자 정보. 값이 비어있으면 기본값 사용. */
export async function getCompany(): Promise<Company> {
  const s = await prisma.siteSetting
    .findUnique({ where: { id: "main" } })
    .catch(() => null);
  const pick = (v: string | null | undefined, d: string) => (v && v.trim() ? v.trim() : d);
  return {
    corpName: pick(s?.companyName, COMPANY.corpName),
    brand: pick(s?.siteName, COMPANY.brand),
    ceo: pick(s?.ceo, COMPANY.ceo),
    bizNo: pick(s?.businessNo, COMPANY.bizNo),
    mailOrderNo: pick(s?.mailOrderNo, COMPANY.mailOrderNo),
    address: pick(s?.address, COMPANY.address),
    csPhone: pick(s?.csPhone, COMPANY.csPhone),
    email: pick(s?.email, COMPANY.email),
    privacyOfficer: pick(s?.privacyOfficer, COMPANY.privacyOfficer),
    privacyEmail: pick(s?.privacyEmail, COMPANY.privacyEmail),
    shopUrl: COMPANY.shopUrl,
    shopName: COMPANY.shopName,
  };
}
