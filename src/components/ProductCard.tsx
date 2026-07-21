import Link from "next/link";
import { won, parseList } from "@/lib/format";

type P = {
  goodsNo: string;
  name: string;
  brand: string | null;
  listPrice: number | null;
  salePrice: number | null;
  commissionRate: number;
  imagesJson: string | null;
};

export default function ProductCard({ product, rank }: { product: P; rank?: number }) {
  const img = parseList(product.imagesJson)[0];
  const discount =
    product.listPrice && product.salePrice && product.listPrice > product.salePrice
      ? Math.round(((product.listPrice - product.salePrice) / product.listPrice) * 100)
      : 0;
  const commission =
    product.salePrice != null ? Math.round((product.salePrice * (product.commissionRate ?? 0)) / 100) : 0;

  return (
    <Link href={`/goods/${product.goodsNo}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f5f4f2]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="prod-img" />
        ) : (
          <div className="flex h-full items-center justify-center text-sub">No Image</div>
        )}
        {rank != null && (
          <span className="absolute left-2 top-2 rounded-md bg-ink/85 px-2 py-0.5 text-xs font-bold text-white">
            {rank}
          </span>
        )}
        {/* 찜 하트 */}
        <button className="absolute bottom-2 right-2 text-white/90 drop-shadow" aria-label="찜">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s-7-4.5-9.5-8.5A5 5 0 0112 6a5 5 0 019.5 6.5C19 16.5 12 21 12 21z" />
          </svg>
        </button>
      </div>

      <div className="pt-2">
        <div className="text-[13px] font-bold">{product.brand ?? "명품"}</div>
        <div className="mt-0.5 line-clamp-1 text-[13px] text-ink/60">{product.name}</div>

        {product.listPrice && discount > 0 && (
          <div className="mt-1 text-[11px] text-sub line-through">{won(product.listPrice)}</div>
        )}
        <div className="mt-0.5 flex items-center gap-1.5">
          {discount > 0 && <span className="text-[16px] font-extrabold text-deal">{discount}%</span>}
          <span className="text-[16px] font-extrabold">{won(product.salePrice)}</span>
        </div>
        {commission > 0 && (
          <div className="mt-1 inline-block rounded bg-brandsoft px-1.5 py-0.5 text-[11px] font-bold text-brand">
            최대 {won(commission)} 수수료
          </div>
        )}
      </div>
    </Link>
  );
}
