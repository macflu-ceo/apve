import { NextResponse } from "next/server";
import { listBrands, listSearchCategories, buildSuggestions } from "@/lib/search";

export const dynamic = "force-dynamic";

// GET /api/search/suggest?q=구 → { items: ["구찌", "구찌 가방", ...] }
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ items: [] });
  try {
    const [brands, cats] = await Promise.all([listBrands(), listSearchCategories()]);
    const items = buildSuggestions(q, brands, cats.map((c) => c.name));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
