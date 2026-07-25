"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

function daysAgo(n: number) {
  const t = Date.now() + 9 * 3600_000 - n * 86400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export default function DateRange({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function set(f: string, t: string) {
    const next = new URLSearchParams(sp.toString());
    next.set("from", f);
    next.set("to", t);
    router.push(`${pathname}?${next.toString()}`);
  }

  const presets = [
    { label: "오늘", n: 0 },
    { label: "7일", n: 6 },
    { label: "30일", n: 29 },
    { label: "90일", n: 89 },
  ];
  const isActive = (n: number) => from === daysAgo(n) && to === daysAgo(0);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => set(e.target.value, to)}
        className="rounded-md border border-line px-2 py-1.5 text-sm"
      />
      <span className="text-sub">~</span>
      <input
        type="date"
        value={to}
        onChange={(e) => set(from, e.target.value)}
        className="rounded-md border border-line px-2 py-1.5 text-sm"
      />
      <div className="flex gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => set(daysAgo(p.n), daysAgo(0))}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isActive(p.n) ? "border-brand bg-brand text-white" : "border-line text-ink/70 hover:border-ink/30"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
