"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { won } from "@/lib/format";
import { updateProduct, deleteProduct } from "./actions";

export type P = {
  id: string;
  goodsNo: string;
  name: string;
  brand: string | null;
  listPrice: number | null;
  salePrice: number | null;
  origin: string | null;
  tags: string[];
  active: boolean;
  image: string | null;
};

export default function ProductRow({
  p,
  checked,
  onToggle,
}: {
  p: P;
  checked?: boolean;
  onToggle?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [origin, setOrigin] = useState(p.origin ?? "");
  const [tags, setTags] = useState(p.tags.join(","));

  const discount =
    p.listPrice && p.salePrice && p.listPrice > p.salePrice
      ? Math.round(((p.listPrice - p.salePrice) / p.listPrice) * 100)
      : 0;

  function save() {
    const nextTags = tags.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
    if (origin === (p.origin ?? "") && nextTags.join(",") === p.tags.join(",")) return;
    start(async () => {
      await updateProduct(p.id, { origin: origin || null, tags: nextTags });
      router.refresh();
    });
  }

  return (
    <tr className={`border-b border-line ${checked ? "bg-brandsoft/50" : ""}`}>
      <td className="py-2">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={!!checked}
          onChange={onToggle}
        />
      </td>
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
      <td className="text-sub line-through">{won(p.listPrice)}</td>
      <td className="font-bold text-deal">{discount > 0 ? `${discount}%` : "-"}</td>
      <td className="font-bold">{won(p.salePrice)}</td>
      {/* 원산지 */}
      <td>
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          onBlur={save}
          placeholder="이탈리아"
          className="w-24 rounded-md border border-line px-2 py-1 text-sm"
        />
      </td>
      {/* 태그 */}
      <td>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          onBlur={save}
          placeholder="신상,단독"
          className="w-28 rounded-md border border-line px-2 py-1 text-sm"
        />
      </td>
      {/* 노출 */}
      <td>
        <button
          onClick={() => start(async () => { await updateProduct(p.id, { active: !p.active }); router.refresh(); })}
          disabled={pending}
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.active ? "bg-deal/15 text-deal" : "bg-line text-sub"}`}
        >
          {p.active ? "노출중" : "숨김"}
        </button>
      </td>
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
