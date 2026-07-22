"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importProduct } from "./actions";

export default function ImportForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await importProduct(fd);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-5">
      <div>
        <label className="text-sm font-medium">고도몰 상품 URL</label>
        <input
          name="url"
          required
          placeholder="https://viaelite.co.kr/goods/goods_view.php?goodsNo=..."
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-ink/50">
          URL을 넣으면 상품명·가격·이미지·사이즈를 자동으로 가져옵니다.
        </p>
      </div>
      <div className="flex items-end gap-3">
        <button className="btn-brand" disabled={pending}>
          {pending ? "가져오는 중…" : "상품 등록"}
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
      )}
    </form>
  );
}
