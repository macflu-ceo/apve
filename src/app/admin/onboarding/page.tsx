import { prisma } from "@/lib/db";
import OnboardingManager from "./OnboardingManager";

export const dynamic = "force-dynamic";

export default async function AdminOnboarding() {
  const slides = await prisma.onboardingSlide.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">첫 실행 온보딩</h1>
      <p className="mb-6 text-sm text-sub">
        앱·웹을 <b>처음 켰을 때 한 번</b> 전체화면으로 보여주는 안내 이미지입니다. 여러 장이면 넘겨서 봅니다.
        (세로형 이미지 권장 · 순서대로 노출)
      </p>
      <OnboardingManager
        slides={slides.map((s) => ({
          id: s.id,
          imageUrl: s.imageUrl,
          caption: s.caption,
          active: s.active,
          sort: s.sort,
        }))}
      />
    </div>
  );
}
