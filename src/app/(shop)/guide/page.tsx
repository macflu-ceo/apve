export default function GuidePage() {
  const steps = [
    { t: "1. 상품 고르기", d: "전체상품보기에서 판매하고 싶은 명품을 선택합니다." },
    { t: "2. 내 코드 만들기", d: "상품 상세에서 ‘내 코드 만들기’를 누르면 내 고유 코드가 붙은 판매 링크가 발급됩니다." },
    { t: "3. 공유 & 판매", d: "발급된 링크를 지인·SNS 등에 공유합니다. 링크로 발생한 주문은 내 성과로 집계됩니다." },
    { t: "4. 수익 확인", d: "내정보에서 판매내역과 누적 수익을 확인합니다." },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">가이드</h1>
      <p className="mb-8 text-sm text-ink/60">돈버는 명품샵에서 판매를 시작하는 방법</p>
      <ol className="space-y-4">
        {steps.map((s) => (
          <li key={s.t} className="card p-5">
            <div className="font-semibold">{s.t}</div>
            <div className="mt-1 text-sm text-ink/70">{s.d}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
