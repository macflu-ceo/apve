import RecoverClient from "./RecoverClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "아이디·비밀번호 찾기" };

export default function RecoverPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-10">
      <h1 className="text-2xl font-bold">아이디·비밀번호 찾기</h1>
      <p className="mt-1 text-sm text-sub">휴대폰 본인인증(카카오·토스 인증서)으로 안전하게 찾아요.</p>
      <RecoverClient />
    </div>
  );
}
