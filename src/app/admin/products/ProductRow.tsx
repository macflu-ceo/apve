"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { won } from "@/lib/format";
import { updateProduct, deleteProduct } from "./actions";

type P = {
  id: string;
  goodsNo: string;
  name: string;
  brand: string | null;
  listPrice: number | null;
  salePrice: number | null;
  commissionRate: number;
  active: boolean;
  image: string | null;
};

export default function ProductRow({ p }: { p: P }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rate, setRate] = useState(String(p.commissionRate));

  const discount =
    p.listPrice && p.salePrice && p.listPrice > p.salePrice
      ? Math.round(((p.listPrice - p.salePrice) / p.listPrice) * 100)
      : 0;
  const expected = p.salePrice != null ? Math.round((p.salePrice * Number(rate || 0)) / 100) : null;

  function saveRate() {
    if (Number(rate) === p.commissionRate) return;
    start(async () => { await updateProduct(p.id, { commissionRate: Number(rate) }); router.refresh(); });
  }

  return (
    <tr className="border-b border-line">
      <td className="py-2">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-[#f4f4f4]" />
        )}
      </td>
      <td className="max-w-[220px]">
        <div className="text-xs text-sub">{p.brand}</div>
        <div className="truncate font-medium">{p.name}</div>
        <div className="text-xs text-sub">#{p.goodsNo}</div>
      </td>
      {/* 정가 */}
      <td className="text-sub line-through">{won(p.listPrice)}</td>
      {/* 할인율 */}
      <td className="font-bold text-deal">{discount > 0 ? `${discount}%` : "-"}</td>
      {/* 판매가 */}
      <td className="font-bold">{won(p.salePrice)}</td>
      {/* 수수료율 (수정) */}
      <td>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={rate}
            step={0.5}
            min={0}
            onChange={(e) => setRate(e.target.value)}
            onBlur={saveRate}
            className="w-16 rounded-md border border-line px-2 py-1 text-sm"
          />
          <span className="text-xs text-sub">%</span>
        </div>
      </td>
      {/* 예상 수익 */}
      <td className="font-semibold text-brand">{won(expected)}</td>
      {/* 노출 토글 */}
      <td>
        <button
          onClick={() => start(async () => { await updateProduct(p.id, { active: !p.active }); router.refresh(); })}
          disabled={pending}
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
        >
          {p.active ? "노출중" : "숨김"}
        </button>
      </td>
      {/* 액션 */}
      <td>
        <div className="flex items-center gap-2 text-xs">
          <Link href={`/goods/${p.goodsNo}`} target="_blank" className="text-brand underline">
            보기
          </Link>
          <button
            onClick={() => { if (confirm("삭제할까요?")) start(async () => { await deleteProduct(p.id); router.refresh(); }); }}
            disabled={pending}
            className="text-red-500 hover:underline"
          >
            삭제
          </button>
        </div>
      </td>
    </tr>
  );
}
