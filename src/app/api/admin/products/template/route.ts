import * as XLSX from "xlsx";
import { BULK_HEADERS, BULK_EXAMPLE } from "@/lib/bulkColumns";

// GET /api/admin/products/template → 엑셀 상품등록 양식(.xlsx) 다운로드
export async function GET() {
  const ws = XLSX.utils.aoa_to_sheet([[...BULK_HEADERS], BULK_EXAMPLE]);
  ws["!cols"] = BULK_HEADERS.map((h) => ({ wch: h === "상품링크" || h === "상품명" ? 40 : 12 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "상품등록");
  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="product-upload-template.xlsx"`,
    },
  });
}
