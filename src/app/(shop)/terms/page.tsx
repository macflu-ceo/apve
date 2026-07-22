import Link from "next/link";
import { TERMS, SETTLEMENT_CONSENT, TERMS_VERSION } from "@/lib/terms";

export const dynamic = "force-dynamic";

const ALL = [...TERMS, SETTLEMENT_CONSENT];

export default function TermsPage({ searchParams }: { searchParams?: { doc?: string } }) {
  const key = searchParams?.doc ?? ALL[0].key;
  const doc = ALL.find((d) => d.key === key) ?? ALL[0];

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl font-bold">약관 및 정책</h1>
      <p className="mb-5 mt-1 text-xs text-sub">버전 {TERMS_VERSION}</p>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {ALL.map((d) => (
          <Link
            key={d.key}
            href={`/terms?doc=${d.key}`}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${
              d.key === doc.key ? "bg-ink text-white" : "bg-[#f5f3f0] text-sub"
            }`}
          >
            {d.title}
          </Link>
        ))}
      </div>

      <article className="rounded-xl2 border border-line bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">{doc.title}</h2>
        <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink/85">{doc.body}</pre>
      </article>
    </div>
  );
}
