import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

// 멀티링크 공유 미리보기(OG) 이미지 — 컨시어지별 자동 생성
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

function firstImage(imagesJson: string | null): string | null {
  try {
    const arr = JSON.parse(imagesJson ?? "[]");
    return Array.isArray(arr) && arr[0] ? String(arr[0]) : null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { slug: string } }) {
  const font = await fetch(new URL("./NotoSansKR-Bold.woff", import.meta.url)).then((r) => r.arrayBuffer());

  const ml = await prisma.multiLink.findUnique({
    where: { slug: params.slug },
    include: {
      items: { orderBy: [{ sort: "asc" }], include: { product: true }, take: 10 },
    },
  });

  const name = ml?.displayName ?? "VIA ÉLITE";
  const bio = ml?.bio ?? "이탈리아 부티크 직계약 100% 정품";
  const avatar = ml?.avatarUrl ?? null;
  const productImgs = (ml?.items ?? [])
    .map((i) => firstImage(i.product.imagesJson))
    .filter((u): u is string => !!u)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #4A60FF 0%, #6E82FF 100%)",
          fontFamily: "NotoSansKR",
        }}
      >
        {/* 왼쪽: 프로필/카피 */}
        <div
          style={{
            flex: 1.2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 30px 0 64px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 8, color: "rgba(255,255,255,0.75)" }}>
            VIA ÉLITE · ITALY DIRECT
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                width={110}
                height={110}
                style={{ borderRadius: 999, border: "5px solid rgba(255,255,255,0.85)", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 999,
                  border: "5px solid rgba(255,255,255,0.85)",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#4A60FF",
                }}
              >
                VÉ
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
              <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.15 }}>{name}의 명품샵</div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 27,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.45,
              maxWidth: 560,
            }}
          >
            {bio}
          </div>
          <div style={{ display: "flex", marginTop: 34, gap: 12 }}>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.16)",
                borderRadius: 999,
                padding: "12px 26px",
                fontSize: 24,
              }}
            >
              100% 정품 보증
            </div>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.16)",
                borderRadius: 999,
                padding: "12px 26px",
                fontSize: 24,
              }}
            >
              이탈리아 부티크 직계약
            </div>
          </div>
        </div>

        {/* 오른쪽: 상품 카드 */}
        <div
          style={{
            width: 380,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
            padding: "40px 56px 40px 0",
          }}
        >
          {productImgs.length > 0 ? (
            productImgs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                width={324}
                height={productImgs.length >= 3 ? 168 : 250}
                style={{
                  borderRadius: 22,
                  objectFit: "cover",
                  background: "#fff",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
                }}
              />
            ))
          ) : (
            <div
              style={{
                width: 324,
                height: 420,
                borderRadius: 22,
                background: "rgba(255,255,255,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                fontWeight: 700,
                color: "#4A60FF",
              }}
            >
              VÉ
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "NotoSansKR", data: font, weight: 700, style: "normal" }],
    }
  );
}
