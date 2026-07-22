"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPartnerGrade } from "./actions";

export default function GradeSelect({
  partnerId,
  gradeId,
  autoName,
  grades,
}: {
  partnerId: string;
  /** 수동 지정된 등급 id (없으면 자동) */
  gradeId: string | null;
  /** 자동 판정 시 적용되는 등급명 */
  autoName: string;
  grades: { id: string; name: string; percent: number }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <select
      value={gradeId ?? ""}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          await setPartnerGrade(partnerId, e.target.value || null);
          router.refresh();
        })
      }
      className="rounded-md border border-line px-2 py-1 text-xs"
    >
      <option value="">자동 ({autoName})</option>
      {grades.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name} {g.percent}%
        </option>
      ))}
    </select>
  );
}
