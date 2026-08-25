import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { conciergeCode } from "@/lib/concierge-access";
import { couponState, dday } from "@/lib/coupon";
import CouponActions from "./CouponActions";

export const dynamic = "force-dynamic";

// 카톡·SNS 공유 미리보기(Open Graph)를 쿠폰별로 개인화 — "컨시어지 · 매장 특별 이용 권한"
export async function generateMetadata({ params }: { params: { id: string } }) {
  const c = await prisma.coupon.findUnique({
    where: { id: params.id },
    select: { conciergeName: true, customerName: true, benefitText: true, store: { select: { name: true } } },
  });
  if (!c) return { title: "특별 이용 권한 · VIA ÉLITE", robots: { index: false } };
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? "www.cashboutique.co.kr"}`;
  const title = `${c.conciergeName} · ${c.store.name} 특별 이용 권한`;
  const description = `${c.customerName}님을 위한 ${c.benefitText}`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: "website", images: [{ url: `${origin}/og-privilege.png`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og-privilege.png`] },
  };
}

const won = (n: number) => n.toLocaleString("ko-KR");

export default async function CouponPage({ params }: { params: { id: string } }) {
  const c = await prisma.coupon.findUnique({ where: { id: params.id }, include: { store: true, reservation: true } });
  if (!c) notFound();

  const st = couponState(c);
  const d = dday(c.endAt);
  const conditions = (c.conditions ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "www.cashboutique.co.kr";
  const verifyUrl = `${proto}://${host}/store-scan?c=${c.id}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240, color: { dark: "#222C25", light: "#ffffff" } });

  const mapUrl = c.store.mapUrl || `https://map.naver.com/v5/search/${encodeURIComponent(c.store.name)}`;
  const expired = st !== "valid";

  return (
    <div style={{ background: "#1b241d", minHeight: "100vh" }} className="flex justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div id="privilege-card" style={{ background: "#1E2545", color: "#E8EBFF" }} className="relative overflow-hidden rounded p-7">
          {/* 1 로고 */}
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/via-elite-logo-white.png" alt="VIA ÉLITE" className="mx-auto h-5 w-auto" />
            <div style={{ letterSpacing: "0.3em" }} className="mt-2 text-[8px] text-[#E8EBFF]/50">STORE PRIVILEGE</div>
          </div>
          <div className="my-5 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(220,195,138,.4),transparent)" }} />

          {/* 2 고객 이름 */}
          <div className="text-center">
            <div style={{ letterSpacing: "0.26em" }} className="text-[8px] text-[#A9B8FF]">특별 이용 권한</div>
            <div style={{ fontFamily: "'Apple SD Gothic Neo',sans-serif" }} className="mt-3 text-[30px] font-light text-white">
              {c.customerName}<span className="ml-1 text-[16px] text-[#E8EBFF]/55">님</span>
            </div>
          </div>

          {/* 3 컨시어지 문구 */}
          <p className="mt-3 text-center text-[12px] font-light leading-relaxed text-[#E8EBFF]/78">
            럭셔리 컨시어지 <span className="text-[#A9B8FF]">{c.conciergeName}</span> 님을 통해<br />
            <span className="text-[#A9B8FF]">{c.store.name} 특별 이용 권한</span>이 부여되었습니다.
          </p>

          {/* 4 PRIVILEGE */}
          <div className="mt-5 rounded border border-[#A9B8FF]/30 bg-[#A9B8FF]/[0.08] px-3 py-4 text-center">
            <div style={{ letterSpacing: "0.26em" }} className="text-[8px] text-[#A9B8FF]">PRIVILEGE</div>
            <div className="mt-2 text-[18px] font-medium text-white">{c.benefitText}</div>
            {c.brandsText && <div className="mt-1.5 text-[11px] font-light text-[#E8EBFF]/62">{c.brandsText}</div>}
          </div>

          {/* 5 컨시어지·코드·유효기간 */}
          <div className="mt-5 grid grid-cols-2 gap-y-4 border-y border-[#A9B8FF]/20 py-4 text-[12px]">
            <div><div className="mb-1 text-[7px] tracking-widest text-[#E8EBFF]/42">CONCIERGE</div><div className="font-light text-[#E8EBFF]">{c.conciergeName} ({conciergeCode(c.conciergeNo)})</div></div>
            <div><div className="mb-1 text-[7px] tracking-widest text-[#E8EBFF]/42">CODE</div><div style={{ fontFamily: "ui-monospace,monospace" }} className="text-[11px] text-[#E8EBFF]">{c.code}</div></div>
            <div className="col-span-2"><div className="mb-1 text-[7px] tracking-widest text-[#E8EBFF]/42">VALID PERIOD</div>
              <div style={{ fontFamily: "ui-monospace,monospace" }} className="text-[11px] text-[#E8EBFF]">
                {c.startAt.toISOString().slice(0, 10)} – {c.endAt.toISOString().slice(0, 10)}
                {st === "valid" && d >= 0 && <span className="ml-2 rounded bg-[#A9B8FF] px-1.5 py-0.5 text-[9px] font-bold text-white">D-{d}</span>}
                {expired && <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-[#E8EBFF]">{st === "used" ? "사용완료" : st === "expired" ? "만료" : "취소"}</span>}
              </div>
            </div>
          </div>

          {/* 6 QR */}
          <div className="mt-5 text-center">
            <div className="mx-auto w-[120px] rounded bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" className="w-full" style={expired ? { opacity: 0.3 } : undefined} />
            </div>
            <div className="mt-2 text-[10px] font-light text-[#E8EBFF]/60">매장 데스크에서 스캔해 주세요</div>
          </div>

          {/* 7 매장 */}
          <div className="mt-5 border-t border-[#A9B8FF]/20 pt-4 text-center">
            <div className="text-[12px] text-[#E8EBFF]">{c.store.name}</div>
            {c.store.address && <div className="mt-1 text-[10px] font-light text-[#E8EBFF]/60">{c.store.address}</div>}
            {c.store.hours && <div className="mt-0.5 text-[9px] text-[#E8EBFF]/42">{c.store.hours} · 방문 예약 권장</div>}
          </div>

          {/* 8 이용조건 */}
          {conditions.length > 0 && (
            <div className="mt-4 border-t border-[#A9B8FF]/20 pt-4">
              <div style={{ letterSpacing: "0.22em" }} className="mb-2 text-center text-[7px] text-[#E8EBFF]/42">이용 조건</div>
              <ul className="mx-auto max-w-[240px] list-disc space-y-0.5 pl-4 text-[10px] font-light text-[#E8EBFF]/62">
                {conditions.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* 9 버튼 (카드 밖 — 이미지에 안 담김) */}
        {!expired ? (
          <CouponActions couponId={c.id} cardId="privilege-card" mapUrl={mapUrl} reserved={c.reservation ? { date: c.reservation.date, time: c.reservation.time } : null} />
        ) : (
          <div className="mt-5 text-center text-sm text-[#E8EBFF]/50">이 권한은 {st === "used" ? "이미 사용되었습니다." : "유효 기간이 지났습니다."}</div>
        )}
      </div>
    </div>
  );
}
