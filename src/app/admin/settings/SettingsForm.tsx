"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "./actions";

type S = {
  siteName: string;
  companyName: string;
  businessNo: string | null;
  contact: string | null;
  footerNote: string;
  bannerInterval: number;
};

export default function SettingsForm({ setting }: { setting: S }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateSettings(fd);
      setMsg(res.message);
      router.refresh();
    });
  }

  const rows: { name: keyof S; label: string; placeholder?: string }[] = [
    { name: "siteName", label: "사이트명" },
    { name: "companyName", label: "회사명" },
    { name: "businessNo", label: "사업자등록번호", placeholder: "435-87-02485" },
    { name: "contact", label: "연락처/이메일" },
    { name: "footerNote", label: "하단 문구" },
  ];

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4 p-6">
      {rows.map((r) => (
        <div key={r.name}>
          <label className="text-sm font-medium">{r.label}</label>
          <input
            name={r.name}
            defaultValue={setting[r.name] ?? ""}
            placeholder={r.placeholder}
            className="field mt-1"
          />
        </div>
      ))}
      <div>
        <label className="text-sm font-medium">메인 배너 자동 전환 시간(초)</label>
        <input
          name="bannerInterval"
          type="number"
          min={1}
          max={60}
          defaultValue={setting.bannerInterval}
          className="field mt-1 w-32"
        />
        <p className="mt-1 text-xs text-sub">홈 메인 배너가 몇 초마다 넘어갈지 설정합니다. (1~60초)</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-brand" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
    </form>
  );
}
