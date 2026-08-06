import Link from "next/link";
import { getCompany } from "@/lib/company";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "회원 탈퇴 및 계정 삭제 안내",
  robots: { index: true, follow: true },
};

// Google Play / App Store 요구: 계정 삭제 방법·삭제/보관 데이터 안내 공개 페이지
export default async function AccountDeletionPage() {
  const c = await getCompany().catch(() => null);
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 text-ink">
      <h1 className="text-2xl font-bold">회원 탈퇴 및 계정 삭제 안내</h1>
      <p className="mt-2 text-sm text-sub">돈버는 명품샵 (제이프리모인터내셔널)</p>

      <section className="mt-8">
        <h2 className="text-lg font-bold">계정 삭제 방법</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
          <li>앱 또는 웹에서 로그인합니다.</li>
          <li>하단 <b>내정보</b>(마이페이지)로 이동합니다.</li>
          <li>페이지 하단의 <b>“회원 탈퇴”</b> 버튼을 누릅니다.</li>
          <li>확인하면 계정과 개인정보가 즉시 삭제됩니다.</li>
        </ol>
        <p className="mt-3 text-sm text-sub">
          직접 삭제가 어려운 경우 고객센터({c?.csPhone ?? "고객센터"} · {c?.email ?? "이메일"})로 요청하시면 처리해 드립니다.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">삭제되는 데이터</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
          <li>계정 정보(아이디, 닉네임)</li>
          <li>개인정보(이름, 휴대폰번호, 이메일)</li>
          <li>본인확인 정보(CI/DI 등)</li>
          <li>정산 정보(계좌·주소 등)</li>
        </ul>
        <p className="mt-2 text-sm text-sub">위 정보는 탈퇴 즉시 삭제 또는 복구 불가능하게 파기됩니다.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">일정 기간 보관되는 데이터</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령에 따라, 다음 기록은 개인 식별정보를 분리·익명화한 상태로
          법정 보관 기간 동안 보관 후 파기됩니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
          <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
          <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년</li>
          <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">처리 기간</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          탈퇴 요청 시 계정 및 개인정보는 <b>즉시</b> 삭제되며, 법정 보관 대상 데이터는 위 기간 경과 후 지체 없이 파기됩니다.
        </p>
      </section>

      <div className="mt-10 border-t border-line pt-5 text-sm text-sub">
        <Link href="/me" className="font-semibold text-brand hover:underline">→ 마이페이지에서 바로 탈퇴하기</Link>
      </div>
    </div>
  );
}
