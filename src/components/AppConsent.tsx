"use client";

// 앱 첫 실행 시 1회: 서비스 이용약관·개인정보 동의 + 앱 알림 수신 동의를 한 화면에서.
// '모두 동의하고 시작하기'로 한 번에. 알림 동의 시 네이티브 푸시 권한 요청.
import { useEffect, useState } from "react";
import Link from "next/link";
import { requestAppPushPermission } from "@/lib/push-client";

const KEY = "app_consent_v1";

export default function AppConsent() {
  const [show, setShow] = useState(false);
  const [service, setService] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [noti, setNoti] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== "1") setShow(true);
  }, []);

  if (!show) return null;

  const allRequired = service && privacy;
  const allChecked = service && privacy && noti;
  const setAll = (v: boolean) => {
    setService(v);
    setPrivacy(v);
    setNoti(v);
  };

  function start() {
    if (!allRequired) return;
    localStorage.setItem(KEY, "1");
    localStorage.setItem("app_noti_consent", noti ? "1" : "0");
    if (noti) requestAppPushPermission(); // 알림 동의 시 OS 권한 요청 + 토큰 등록
    setShow(false);
  }

  const Row = ({
    checked,
    onChange,
    required,
    children,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <label className="flex items-center gap-3 py-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-brand"
      />
      <span className="flex-1">
        <span className={required ? "text-brand" : "text-sub"}>[{required ? "필수" : "선택"}]</span> {children}
      </span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="text-lg font-black text-ink">돈버는 명품샵 시작하기</div>
        <p className="mt-1 text-sm text-ink/60">서비스 이용을 위해 아래 항목에 동의해 주세요.</p>

        <button
          onClick={() => setAll(!allChecked)}
          className="mt-4 flex w-full items-center gap-3 rounded-xl2 border border-line bg-brandsoft px-4 py-3 text-left"
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded ${allChecked ? "bg-brand text-white" : "border border-line-strong"}`}>
            {allChecked && "✓"}
          </span>
          <span className="font-bold text-ink">모두 동의하기</span>
        </button>

        <div className="mt-2 divide-y divide-line border-t border-line">
          <Row checked={service} onChange={setService} required>
            <Link href="/terms?doc=service" target="_blank" className="underline">서비스 이용약관</Link> 동의
          </Row>
          <Row checked={privacy} onChange={setPrivacy} required>
            <Link href="/terms?doc=privacy_policy" target="_blank" className="underline">개인정보 수집·이용</Link> 동의
          </Row>
          <Row checked={noti} onChange={setNoti}>
            앱 알림 수신 동의 <span className="text-xs text-sub">(혜택·방문예약·판매 알림)</span>
          </Row>
        </div>

        <button
          onClick={start}
          disabled={!allRequired}
          className="mt-5 w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-white disabled:opacity-40"
        >
          동의하고 시작하기
        </button>
        {!allRequired && <p className="mt-2 text-center text-xs text-sub">필수 항목에 동의해야 시작할 수 있어요.</p>}
      </div>
    </div>
  );
}
