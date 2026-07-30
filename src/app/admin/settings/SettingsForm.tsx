"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "./actions";
import ImageUploader from "@/components/ImageUploader";

type S = {
  siteName: string;
  companyName: string;
  businessNo: string | null;
  contact: string | null;
  footerNote: string;
  bannerInterval: number;
  ceo: string | null;
  mailOrderNo: string | null;
  address: string | null;
  csPhone: string | null;
  email: string | null;
  privacyOfficer: string | null;
  privacyEmail: string | null;
  ogImage: string | null;
  appIosUrl: string | null;
  appAndroidUrl: string | null;
  appLandingUrl: string | null;
  appBoostPercent: number;
  webDailyCodeLimit: number;
  appSplashUrl: string | null;
  offlineTitle: string | null;
  offlineMessage: string | null;
  pushOnSale: boolean;
};

export default function SettingsForm({ setting }: { setting: S }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ogImage, setOgImage] = useState(setting.ogImage ?? "");
  const [appSplash, setAppSplash] = useState(setting.appSplashUrl ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateSettings(fd);
      setMsg(res.message);
      router.refresh();
    });
  }

  const rows: { name: keyof S; label: string; placeholder?: string }[] = [
    { name: "siteName", label: "사이트명" },
    { name: "footerNote", label: "하단 문구(소개)" },
  ];

  // 사업자 정보 (약관·개인정보처리방침·푸터에 공통 반영)
  const bizRows: { name: keyof S; label: string; placeholder?: string }[] = [
    { name: "companyName", label: "상호(법인명)", placeholder: "주식회사 제이프리모인터내셔널" },
    { name: "ceo", label: "대표자명", placeholder: "지준우" },
    { name: "businessNo", label: "사업자등록번호", placeholder: "435-87-02485" },
    { name: "mailOrderNo", label: "통신판매업 신고번호", placeholder: "2024-서울강남-06628호" },
    { name: "address", label: "사업장 주소", placeholder: "서울특별시 강남구 …" },
    { name: "csPhone", label: "고객센터 전화", placeholder: "1533-1658" },
    { name: "email", label: "대표 이메일", placeholder: "info@jprimo.com" },
    { name: "privacyOfficer", label: "개인정보 보호책임자", placeholder: "이긍정" },
    { name: "privacyEmail", label: "개인정보 책임자 이메일", placeholder: "greg@jprimo.com" },
  ];

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4 p-6">
      {rows.map((r) => (
        <div key={r.name}>
          <label className="text-sm font-medium">{r.label}</label>
          <input
            name={r.name}
            defaultValue={(setting[r.name] as string | null) ?? ""}
            placeholder={r.placeholder}
            className="field mt-1"
          />
        </div>
      ))}

      <div className="border-t border-line pt-4">
        <div className="mb-1 text-sm font-bold">사업자 정보</div>
        <p className="mb-3 text-xs text-sub">
          여기서 저장하면 <b>푸터·이용약관·개인정보처리방침·환불정책</b>에 자동 반영됩니다. (이사 등 변경 시 여기만 수정)
        </p>
        <div className="space-y-4">
          {bizRows.map((r) => (
            <div key={r.name}>
              <label className="text-sm font-medium">{r.label}</label>
              <input
                name={r.name}
                defaultValue={(setting[r.name] as string | null) ?? ""}
                placeholder={r.placeholder}
                className="field mt-1"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line pt-4">
        <div className="mb-1 text-sm font-bold">링크 공유 미리보기 이미지 (OG)</div>
        <p className="mb-2 text-xs text-sub">
          카카오톡·네이버·SNS에 링크를 보낼 때 뜨는 대표 이미지입니다. <b>권장 크기 1200 × 630</b> (가로형).
        </p>
        <input type="hidden" name="ogImage" value={ogImage} />
        <div className="max-w-md">
          <ImageUploader value={ogImage} onChange={setOgImage} label="OG 이미지" />
        </div>
        {ogImage && (
          <button
            type="button"
            onClick={() => setOgImage("")}
            className="mt-2 text-xs text-red-500 hover:underline"
          >
            이미지 제거
          </button>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <div className="mb-1 text-sm font-bold">📱 앱 다운로드 유도</div>
        <p className="mb-3 text-xs text-sub">
          웹(브라우저) 방문자에게만 상단 <b>앱 다운로드 바</b>가 뜹니다. 앱 안에서는 자동으로 숨겨집니다.
          <br />
          모바일은 해당 스토어로, PC는 랜딩(QR) 링크로 이동합니다. 비워두면 노출되지 않습니다.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">iOS 앱스토어 링크</label>
            <input name="appIosUrl" defaultValue={setting.appIosUrl ?? ""} placeholder="https://apps.apple.com/..." className="field mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Android 플레이스토어 링크</label>
            <input name="appAndroidUrl" defaultValue={setting.appAndroidUrl ?? ""} placeholder="https://play.google.com/store/apps/..." className="field mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">PC용 랜딩(QR) 링크</label>
            <input name="appLandingUrl" defaultValue={setting.appLandingUrl ?? ""} placeholder="https://cashboutique.co.kr/app" className="field mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">앱 전용 첫판매 프리미엄(%p)</label>
            <input name="appBoostPercent" type="number" min={0} max={50} defaultValue={setting.appBoostPercent} className="field mt-1 w-32" />
            <p className="mt-1 text-xs text-sub">
              <b>첫구매 등급</b>에만 적용. 앱은 원요율(현재 20%) 그대로, <b>웹은 이만큼 낮게</b> 지급됩니다.
              <br />
              예) 10 입력 → 웹 첫판매 10% / 앱 첫판매 20%. 웹 상세페이지엔 "앱에서 올리기" 버튼이 뜹니다. <b>0이면 웹·앱 동일(미적용)</b>.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <div className="mb-1 text-sm font-bold">📱 앱 전용 설정</div>
        <p className="mb-3 text-xs text-sub">앱(웹뷰) 실행·이용 경험과 웹→앱 유도에 쓰입니다.</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">웹 하루 코드 발급 한도</label>
            <input name="webDailyCodeLimit" type="number" min={0} max={999} defaultValue={setting.webDailyCodeLimit} className="field mt-1 w-32" />
            <p className="mt-1 text-xs text-sub">웹에서 하루 이만큼만 코드 생성 → 초과 시 "앱에서 무제한" 유도. <b>0이면 무제한</b>. 앱은 항상 무제한.</p>
          </div>

          <div>
            <label className="text-sm font-medium">앱 스플래시(로딩) 이미지</label>
            <p className="mb-2 text-xs text-sub">네이티브 앱을 켤 때 잠깐 뜨는 이미지입니다. (정사각/세로형, 로고 중앙 권장)</p>
            <input type="hidden" name="appSplashUrl" value={appSplash} />
            <div className="max-w-[200px]">
              <ImageUploader value={appSplash} onChange={setAppSplash} label="스플래시 이미지" />
            </div>
            {appSplash && (
              <button type="button" onClick={() => setAppSplash("")} className="mt-1 text-xs text-red-500 hover:underline">이미지 제거</button>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">오프라인(네트워크 끊김) 안내</label>
            <p className="mb-2 text-xs text-sub">앱에서 인터넷이 끊겼을 때 보여줄 문구입니다.</p>
            <input name="offlineTitle" defaultValue={setting.offlineTitle ?? ""} placeholder="제목 (예: 인터넷 연결을 확인해주세요)" className="field mb-2" />
            <textarea name="offlineMessage" defaultValue={setting.offlineMessage ?? ""} placeholder="설명 (예: 네트워크가 불안정합니다. 잠시 후 다시 시도해주세요.)" className="field h-16 resize-none" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pushOnSale" defaultChecked={setting.pushOnSale} className="h-4 w-4" />
            <span><b>판매 발생 시</b> 해당 회원에게 앱 푸시 자동 발송 (특정행동 트리거)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">메인 배너 자동 전환 시간(초)</label>
        <input
          name="bannerInterval"
          type="number"
          min={1}
          max={60}
          defaultValue={setting.bannerInterval}
          className="field mt-1 w-32"
        />
        <p className="mt-1 text-xs text-sub">홈 메인 배너가 몇 초마다 넘어갈지 설정합니다. (1~60초)</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-brand" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
    </form>
  );
}
