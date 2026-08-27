"use client";

/** 앱 전용 고정 기기 ID — 웹뷰 쿠키가 재시작에 날아가도 같은 기기는 같은 사람으로 집계.
 *  매 이벤트에 실어 보내 서버가 쿠키 대신 이 값을 쓰므로 콜드스타트 첫 화면부터 정확하다. */
function stableVid(): string | undefined {
  try {
    if (!navigator.userAgent.includes("CashBoutiqueApp")) return undefined; // 앱 웹뷰만
    let v = localStorage.getItem("vid_stable");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("vid_stable", v);
    }
    return v;
  } catch {
    return undefined;
  }
}

// 클라이언트에서 방문/클릭 이벤트를 서버로 보낸다. 실패는 조용히 무시.
export function trackEvent(
  kind: "page" | "product" | "click" | "impression",
  opts: {
    path?: string;
    label?: string;
    goodsNo?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  } = {}
) {
  try {
    const path = opts.path ?? window.location.pathname;
    if (/^\/(admin|api)/.test(path)) return;

    // 앱 유도 행동 카운터: 주요 행동마다 +1 (상품·카테고리 열람, 코드/AI/다운로드/더보기 클릭)
    // 단, app_cta_* 노출/클릭 자체는 카운트 대상에서 제외(자기 자신 유발 방지)
    const isCtaEvent = opts.label?.startsWith("app_cta_");
    const qualifies =
      !isCtaEvent &&
      ((kind === "product") ||
        (kind === "page" && /^\/(category|goods)/.test(path)) ||
        (kind === "click" && ["code", "ai", "download", "more"].includes(opts.label ?? "")));
    if (qualifies) {
      try {
        window.dispatchEvent(new Event("cta-engage"));
      } catch {
        /* noop */
      }
    }
    const payload = JSON.stringify({
      path,
      kind,
      label: opts.label,
      goodsNo: opts.goodsNo,
      referrer: opts.referrer,
      utmSource: opts.utmSource,
      utmMedium: opts.utmMedium,
      utmCampaign: opts.utmCampaign,
      svid: stableVid(),
    });
    // keepalive: 페이지 이탈 중에도 전송 보장
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

/**
 * 앱 유도(CTA) 장치별 성과 추적.
 * 장치마다 고유 source(topbar/upsell/codelimit/pop5/pop20/pop40 …)를 넘기면
 * label = `app_cta_<source>` 로 기록된다. 노출(impression)+클릭(click)을 같은 이름으로
 * 남겨서 어드민에서 장치별 전환율(클릭/노출)을 뽑는다.
 */
export function trackAppCta(source: string, kind: "impression" | "click", goodsNo?: string) {
  trackEvent(kind, { label: `app_cta_${source}`, goodsNo });
}

/** 앱 유도 카운터를 1 올린다(웹 사용자의 주요 행동). 5/20/40 도달 시 팝업 트리거용. */
export function bumpEngagement() {
  try {
    window.dispatchEvent(new Event("cta-engage"));
  } catch {
    /* noop */
  }
}

/** 기기별 앱 다운로드 목적지 — 모바일은 해당 스토어, PC는 랜딩 */
export function resolveStoreUrl(u: {
  ios: string | null;
  android: string | null;
  landing: string | null;
}): string | null {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return u.ios || u.landing;
  if (/Android/i.test(ua)) return u.android || u.landing;
  return u.landing || u.ios || u.android; // PC
}
