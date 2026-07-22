import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { parseList } from "@/lib/format";
import { productUrl } from "@/lib/godomall/link";
import { BULK_HEADERS } from "@/lib/bulkColumns";

// 항상 최신 데이터로 내보내야 하므로 빌드시 프리렌더하지 않는다
export const dynamic = "force-dynamic";

// GET /api/admin/products/export → 등록된 전체 상품을 양식과 동일한 형식의 .xlsx로 다운로드
export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  const rows = products.map((p) => [
    p.sourceUrl || productUrl(p.goodsNo),
    p.name,
    p.brand ?? "",
    p.category ?? "",
    parseList(p.sizesJson).join(","),
    p.stock ?? "",
    p.listPrice ?? "",
    p.salePrice ?? "",
    parseList(p.imagesJson)[0] ?? "",
    p.origin ?? "",
    parseList(p.tagsJson).join(","),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([[...BULK_HEADERS], ...rows]);
  ws["!cols"] = BULK_HEADERS.map((h) => ({ wch: h === "상품링크" || h === "상품명" || h === "이미지URL" ? 40 : 12 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "상품목록");
  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-export.xlsx"`,
    },
  });
}
