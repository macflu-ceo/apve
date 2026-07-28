import CatalogBrowser from "./CatalogBrowser";

export const dynamic = "force-dynamic";

export default function AdminCatalog() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">고도몰 상품 픽</h1>
      <p className="mb-5 text-sm text-sub">
        고도몰(viaelite.co.kr) 카탈로그를 신상·브랜드·마진·인기로 골라 돈버는명품샵에 등록합니다.
        <br />
        공급가·마진은 <b>내부 운영용</b>입니다. 소비자 화면에는 노출되지 않습니다.
      </p>
      <CatalogBrowser />
    </div>
  );
}
