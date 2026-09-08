import type { Metadata } from "next";
import Link from "next/link";
import { getCompany } from "@/lib/company";
import SignupKakao from "./SignupKakao";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "회원가입",
  description: "카카오계정으로 돈버는 명품샵에 가입하고, 코드 하나로 명품을 판매해 수수료를 정산받으세요.",
};

/** 수집하는 개인정보 표 — 카카오 동의항목과 1:1로 맞춘다 */
const COLLECT = [
  {
    item: "이름",
    req: "필수",
    when: "카카오계정으로 회원가입할 때",
    why: "수익금 정산 시 제출받는 신분증·통장 사본의 예금주와 대조하여 본인 확인, 원천징수 신고 대상자 특정",
  },
  {
    item: "생일 · 출생연도",
    req: "필수",
    when: "카카오계정으로 회원가입할 때",
    why: "만 14세 미만 가입 차단(연령 확인), 정산 시 신분증 생년월일 대조를 통한 본인 확인",
  },
  {
    item: "전화번호(카카오계정)",
    req: "필수",
    when: "카카오계정으로 회원가입할 때",
    why: "1인 1계정 관리(중복·부정 가입 방지), 판매 성사·정산 지급 등 거래 관련 알림 발송",
  },
  {
    item: "성별",
    req: "선택",
    when: "카카오계정으로 회원가입할 때",
    why: "성별 맞춤 상품 카테고리·사이즈 추천 (미동의 시에도 이용 제한 없음)",
  },
];

const STEPS = [
  { title: "내 코드 발급", body: "마음에 드는 상품마다 내 판매 링크(코드)를 발급해 공유합니다." },
  { title: "판매 성사", body: "내 링크로 구매가 일어나면 수수료가 적립되고 알림을 받습니다." },
  { title: "수익금 정산", body: "정산 신청 시 신분증·통장 사본을 제출하면, 가입 시 받은 이름·생년월일과 대조해 본인 확인 후 지급합니다." },
];

export default async function SignupPage() {
  const COMPANY = await getCompany();

  return (
    <div className="px-4 py-8">
      <div className="text-[10px] font-bold tracking-[0.3em] text-brand">CASH BOUTIQUE</div>
      <h1 className="mt-1 text-2xl font-extrabold">회원가입</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        돈버는 명품샵은 코드 하나로 명품을 판매하고 수수료를 정산받는 어필리에이트 플랫폼입니다. 수익금이 지급되는
        서비스이므로 가입 시 받은 정보로 본인 확인 절차를 거칩니다.
      </p>

      {/* ① 카카오 가입 */}
      <section className="mt-7 rounded-xl2 border border-line p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-white">1</span>
          <h2 className="text-base font-extrabold">카카오계정으로 회원가입</h2>
        </div>
        <p className="mb-4 mt-1.5 pl-8 text-xs text-ink/60">아래 버튼을 누르면 회원가입이 진행됩니다.</p>
        <SignupKakao />
      </section>

      {/* ② 수집하는 개인정보 */}
      <section className="mt-5 rounded-xl2 border border-line p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-white">2</span>
          <h2 className="text-base font-extrabold">수집하는 개인정보</h2>
        </div>
        <p className="mt-1.5 pl-8 text-xs text-ink/60">회원가입 시 카카오계정으로부터 아래 정보를 제공받습니다.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-line text-left text-sub">
                <th className="py-2 pr-3 font-bold">수집 항목</th>
                <th className="py-2 pr-3 font-bold">구분</th>
                <th className="py-2 pr-3 font-bold">수집 시점</th>
                <th className="py-2 font-bold">이용 목적</th>
              </tr>
            </thead>
            <tbody>
              {COLLECT.map((r) => (
                <tr key={r.item} className="border-b border-line align-top">
                  <td className="py-2.5 pr-3 font-bold text-brand">{r.item}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">{r.req}</td>
                  <td className="py-2.5 pr-3">{r.when}</td>
                  <td className="py-2.5 leading-relaxed">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-sub">
          <li>· 보유 기간: <b className="text-ink">회원 탈퇴 시까지.</b> 탈퇴하면 지체 없이 파기하며, 정산 이력이 있는 경우 관계 법령(국세기본법 등)에 따른 기간 동안만 보관합니다.</li>
          <li>· 위 항목은 회원 식별·연령 확인·정산 본인 확인·거래 알림 발송 외의 목적으로 사용하지 않습니다.</li>
          <li>· 필수 항목에 동의하지 않으면 회원가입이 제한됩니다. 선택 항목은 미동의 시에도 이용 제한이 없습니다.</li>
          <li>
            · 자세한 내용은{" "}
            <Link href="/terms?doc=privacy_policy" className="font-bold text-ink underline">
              개인정보처리방침
            </Link>
            을 확인해 주세요.
          </li>
        </ul>
      </section>

      {/* ③ 가입 후 이용 절차 */}
      <section className="mt-5 rounded-xl2 border border-line p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-white">3</span>
          <h2 className="text-base font-extrabold">가입 후 이용 절차</h2>
        </div>
        <div className="mt-4 space-y-3 pl-1">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brandsoft text-[11px] font-extrabold text-brand">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-bold">{s.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ④ 회원 탈퇴 */}
      <section className="mt-5 rounded-xl2 border border-line p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-white">4</span>
          <h2 className="text-base font-extrabold">회원 탈퇴</h2>
        </div>
        <p className="mt-2 pl-8 text-sm text-ink/80">언제든지 직접 탈퇴할 수 있습니다.</p>
        <div className="ml-8 mt-2 rounded-lg bg-brandsoft px-3 py-2 text-xs">
          경로: <b>내정보 → 계정 관리 → 회원 탈퇴 → 확인</b>
        </div>
        <ul className="ml-8 mt-2 space-y-1 text-[11px] leading-relaxed text-sub">
          <li>· 탈퇴하면 카카오계정 연결이 해제되고, 수집한 개인정보는 지체 없이 파기됩니다.</li>
          <li>· 탈퇴 처리에 어려움이 있으면 고객센터 {COMPANY.csPhone} 로 요청해 주세요.</li>
        </ul>
      </section>

      <div className="mt-8 border-t border-line pt-4 text-[11px] leading-relaxed text-sub">
        {COMPANY.corpName} · 대표 {COMPANY.ceo}
        <br />
        고객센터 {COMPANY.csPhone} · 개인정보 보호책임자 {COMPANY.privacyOfficer}
        <br />
        <Link href="/terms?doc=privacy_policy" className="underline">개인정보처리방침</Link> ·{" "}
        <Link href="/terms?doc=service" className="underline">서비스 이용약관</Link>
      </div>
    </div>
  );
}
