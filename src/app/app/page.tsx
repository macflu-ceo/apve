import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteSetting } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "돈버는 명품샵 앱 다운로드",
  description: "아이폰은 App Store, 안드로이드는 Google Play로 자동 이동합니다.",
};

// 스토어 기본값 (어드민 설정이 비어있을 때)
const DEFAULT_IOS = "https://apps.apple.com/app/id6798639671";
const DEFAULT_ANDROID = "https://play.google.com/store/apps/details?id=kr.co.cashboutique.app";

// KST 기준 오늘 날짜 YYYY-MM-DD
function kstDay() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

// MD 리포트용: 스마트링크 방문/전환을 액션명(label)으로 기록
async function logHit(label: "app_smartlink_ios" | "app_smartlink_android" | "app_smartlink_pc") {
  try {
    const c = await cookies();
    const vid = c.get("vid")?.value || "anon";
    await prisma.visit.create({
      data: {
        visitorId: vid,
        path: "/app",
        kind: "app_download",
        label,
        platform: "web",
        day: kstDay(),
      },
    });
  } catch {
    /* 트래킹 실패는 무시 */
  }
}

export default async function AppSmartLink() {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const setting = await getSiteSetting();
  const ios = setting.appIosUrl || DEFAULT_IOS;
  const android = setting.appAndroidUrl || DEFAULT_ANDROID;

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    await logHit("app_smartlink_ios");
    redirect(ios);
  }
  if (isAndroid) {
    await logHit("app_smartlink_android");
    redirect(android);
  }

  // PC — 안내 페이지 (둘 다 버튼)
  await logHit("app_smartlink_pc");
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-14 text-center">
      <div className="text-2xl font-black text-ink">돈버는 명품샵 앱</div>
      <p className="mt-2 text-sm text-sub">
        모바일에서 이 링크를 열면 스토어로 자동 이동해요.<br />
        아래에서 사용 중인 스토어를 선택하세요.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <a
          href={ios}
          className="flex items-center justify-center gap-2 rounded-xl2 bg-ink px-5 py-4 text-base font-bold text-white hover:opacity-90"
        >
           App Store (아이폰)
        </a>
        <a
          href={android}
          className="flex items-center justify-center gap-2 rounded-xl2 border border-line px-5 py-4 text-base font-bold text-ink hover:bg-brandsoft"
        >
          ▶ Google Play (안드로이드)
        </a>
      </div>

      <p className="mt-6 text-xs text-sub">cashboutique.co.kr/app</p>
    </div>
  );
}
