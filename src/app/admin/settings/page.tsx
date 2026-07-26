import { getSiteSetting } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const setting = await getSiteSetting();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">계정정보 / 설정</h1>
      <p className="mb-6 text-sm text-sub">사이트명·회사정보는 하단(푸터) 등 사이트 전반에 반영됩니다.</p>
      <SettingsForm
        setting={{
          siteName: setting.siteName,
          companyName: setting.companyName,
          businessNo: setting.businessNo,
          contact: setting.contact,
          footerNote: setting.footerNote,
          bannerInterval: setting.bannerInterval,
          ceo: setting.ceo,
          mailOrderNo: setting.mailOrderNo,
          address: setting.address,
          csPhone: setting.csPhone,
          email: setting.email,
          privacyOfficer: setting.privacyOfficer,
          privacyEmail: setting.privacyEmail,
          ogImage: setting.ogImage,
        }}
      />
    </div>
  );
}
