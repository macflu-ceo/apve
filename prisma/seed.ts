// 더미 데이터 시드 — 실행: npm run db:seed
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// lib/auth.ts 와 동일한 형식(salt:hash)의 비밀번호 해시
function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const IMG = (n: number) =>
  `https://jprimo-partners-system-bucket.s3.amazonaws.com/products/jprimo-product-c6111d4af9e04e1b851de6a7df944cbd/${n}.jpg`;

// 데모 상품 (그리드 채우기용 플레이스홀더 — 실제 상품 등록 시 대체)
const DEMO = [
  { goodsNo: "1000466837", brand: "Stone Island", name: "[Stone Island] SS25 Sand Knitwear", listPrice: 706000, salePrice: 360686, img: 1, sizes: ["Sand-XXXL"] },
  { goodsNo: "900001", brand: "Maison Margiela", name: "[Maison Margiela] 페이디드 니트 탑", listPrice: 890000, salePrice: 445000, img: 2, sizes: ["S", "M", "L"] },
  { goodsNo: "900002", brand: "Bottega Veneta", name: "[Bottega Veneta] 인트레치아토 크루넥", listPrice: 1250000, salePrice: 812500, img: 3, sizes: ["M", "L"] },
  { goodsNo: "900003", brand: "Prada", name: "[Prada] 리네아 로사 니트", listPrice: 980000, salePrice: 490000, img: 1, sizes: ["S", "M", "L", "XL"] },
  { goodsNo: "900004", brand: "Moncler", name: "[Moncler] 로고 패치 스웨터", listPrice: 1120000, salePrice: 728000, img: 2, sizes: ["M", "L"] },
  { goodsNo: "900005", brand: "Thom Browne", name: "[Thom Browne] 4바 클래식 니트", listPrice: 1490000, salePrice: 894000, img: 3, sizes: ["1", "2", "3"] },
  { goodsNo: "900006", brand: "Loro Piana", name: "[Loro Piana] 베이비 캐시미어 풀오버", listPrice: 2350000, salePrice: 1645000, img: 1, sizes: ["48", "50", "52"] },
  { goodsNo: "900007", brand: "Gucci", name: "[Gucci] GG 자카드 울 니트", listPrice: 1680000, salePrice: 924000, img: 2, sizes: ["S", "M", "L"] },
];

async function main() {
  // 승인된 파트너 (로그인: concierge1 / password1)
  const partner = await prisma.partner.upsert({
    where: { username: "concierge1" },
    update: {},
    create: {
      username: "concierge1",
      passwordHash: hashPassword("password1"),
      name: "김컨시어지",
      phone: "010-0000-0000",
      verified: true,
      status: "approved",
      code: "ic001ws",
    },
  });

  // 데모용 승인 대기 신청자 (어드민에서 승인 테스트)
  await prisma.partner.upsert({
    where: { username: "newbie1" },
    update: {},
    create: {
      username: "newbie1",
      passwordHash: hashPassword("password1"),
      name: "이신청",
      phone: "010-1234-5678",
      verified: true,
      status: "pending",
    },
  });

  let firstProductId = "";
  for (const d of DEMO) {
    // 대표 이미지를 img 인덱스부터 시작하도록 로테이션
    const images = [IMG(d.img), IMG((d.img % 3) + 1), IMG(((d.img + 1) % 3) + 1)];
    const p = await prisma.product.upsert({
      where: { goodsNo: d.goodsNo },
      update: {
        name: d.name,
        brand: d.brand,
        listPrice: d.listPrice,
        salePrice: d.salePrice,
        imagesJson: JSON.stringify(images),
        sizesJson: JSON.stringify(d.sizes),
      },
      create: {
        goodsNo: d.goodsNo,
        name: d.name,
        brand: d.brand,
        listPrice: d.listPrice,
        salePrice: d.salePrice,
        stock: 3,
        sizesJson: JSON.stringify(d.sizes),
        material: "울 / 캐시미어 혼방",
        imagesJson: JSON.stringify(images),
        sourceUrl: `https://viaelite.co.kr/goods/goods_view.php?goodsNo=${d.goodsNo}`,
      },
    });
    if (!firstProductId) firstProductId = p.id;
  }

  // 샘플 판매내역 (첫 상품 기준)
  const already = await prisma.sale.count();
  if (already === 0) {
    await prisma.sale.create({
      data: {
        productId: firstProductId,
        partnerId: partner.id,
        code: partner.code ?? "ic001ws",
        amount: 360686,
        commission: 36069,
        status: "confirmed",
        orderNo: "20260721-0001",
        orderedAt: new Date("2026-07-20T10:00:00Z"),
      },
    });
  }

  console.log(`✅ 시드 완료: 파트너 ${partner.code} · 상품 ${DEMO.length}개`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
