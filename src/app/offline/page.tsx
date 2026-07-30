import { getSiteSetting } from "@/lib/settings";
import RetryButton from "./RetryButton";

export const dynamic = "force-dynamic";

// 네트워크 끊김 시 앱(웹뷰)이 보여주는 화면. 문구는 어드민 설정에서 관리.
export default async function OfflinePage() {
  const s = await getSiteSetting().catch(() => null);
  const title = s?.offlineTitle || "인터넷 연결을 확인해주세요";
  const message = s?.offlineMessage || "네트워크가 불안정합니다. 연결을 확인한 뒤 다시 시도해주세요.";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-sub">{message}</p>
      <RetryButton />
    </div>
  );
}
