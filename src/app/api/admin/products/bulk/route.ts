import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { extractGoodsNo, productUrl } from "@/lib/godomall/link";

const str = (v: unknown) => (v == null ? null : String(v).trim() || null);
const int = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Math.round(parseFloat(String(v).replace(/,/g, "")));
  return Number.isNaN(n) ? null : n;
};

// POST /api/admin/products/bulk  (multipart: file .xlsx/.csv)
// 양식대로 여러 상품을 일괄 등록/갱신한다. (upsert by goodsNo)
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

    const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNo = i + 2; // 헤더가 1행
      const link = String(row["상품링크"] ?? "").trim();
      if (!link) continue; // 빈 행 스킵
      const goodsNo = extractGoodsNo(link);
      if (!goodsNo) {
        errors.push(`${rowNo}행: 상품링크에서 goodsNo를 찾을 수 없습니다.`);
        continue;
      }

      const sizes = String(row["사이즈"] ?? "")
        .split(/[,\s/]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const img = String(row["이미지URL"] ?? "").trim();
      const tags = String(row["태그"] ?? "")
        .split(/[,/]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const data = {
        name: String(row["상품명"] ?? "").trim() || `상품 ${goodsNo}`,
        brand: str(row["브랜드"]),
        category: str(row["카테고리"]),
        origin: str(row["원산지"]),
        tagsJson: JSON.stringify(tags),
        sizesJson: JSON.stringify(sizes),
        stock: int(row["재고"]),
        listPrice: int(row["리테일가격"]),
        salePrice: int(row["공급가"]),
        sourceUrl: productUrl(goodsNo),
        ...(img ? { imagesJson: JSON.stringify([img]) } : {}),
      };

      try {
        const existing = await prisma.product.findUnique({ where: { goodsNo } });
        await prisma.product.upsert({
          where: { goodsNo },
          update: data,
          create: { goodsNo, ...data },
        });
        existing ? updated++ : created++;
      } catch (e) {
        errors.push(`${rowNo}행: 저장 실패 (${e instanceof Error ? e.message : "오류"})`);
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    return NextResponse.json({ created, updated, total: rows.length, errors });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "엑셀 처리 실패" }, { status: 500 });
  }
}
