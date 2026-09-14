"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSettlement } from "./actions";

// ── 다음(카카오) 우편번호 검색 ──────────────────────────────
// 키 없이 쓰는 공개 스크립트. 검색으로 우편번호·도로명 주소를 받아오고
// 사용자는 상세주소만 입력한다. 최종 주소는 "(우편번호) 도로명, 상세" 한 줄로 합친다.
type DaumPostcodeData = { zonecode: string; roadAddress: string; jibunAddress: string; buildingName?: string };
declare global {
  interface Window {
    daum?: { Postcode: new (opts: { oncomplete: (d: DaumPostcodeData) => void; width?: string; height?: string }) => { embed: (el: HTMLElement) => void } };
  }
}
function loadPostcodeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) return resolve();
    const s = document.createElement("script");
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("주소 검색을 불러오지 못했습니다"));
    document.head.appendChild(s);
  });
}

function AddressField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [zip, setZip] = useState("");
  const [base, setBase] = useState("");
  const [detail, setDetail] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const compose = (z: string, b: string, d: string) =>
    onChange([z && `(${z})`, b, d.trim()].filter(Boolean).join(" ").replace(/\s+/g, " ").trim());

  async function search() {
    try {
      await loadPostcodeScript();
      setOpen(true);
      requestAnimationFrame(() => {
        if (!boxRef.current || !window.daum) return;
        boxRef.current.innerHTML = "";
        new window.daum.Postcode({
          oncomplete: (d) => {
            const road = d.roadAddress || d.jibunAddress;
            const b = d.buildingName ? `${road} (${d.buildingName})` : road;
            setZip(d.zonecode);
            setBase(b);
            compose(d.zonecode, b, detail);
            setOpen(false);
          },
          width: "100%",
          height: "100%",
        }).embed(boxRef.current);
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "주소 검색 오류");
    }
  }

  return (
    <div>
      <label className="text-xs text-sub">주소 *</label>
      <div className="mt-1 flex gap-2">
        <input
          className="field flex-1"
          readOnly
          placeholder="우편번호 찾기를 눌러주세요"
          value={base ? `(${zip}) ${base}` : value}
          onClick={search}
        />
        <button type="button" onClick={search} className="shrink-0 rounded-xl bg-ink px-4 text-sm font-bold text-white">
          우편번호 찾기
        </button>
      </div>
      <input
        className="field mt-2"
        placeholder="상세주소 (동·호수 등)"
        value={detail}
        onChange={(e) => {
          setDetail(e.target.value);
          if (base) compose(zip, base, e.target.value);
        }}
      />

      {open && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <b className="text-sm">주소 검색</b>
            <button type="button" onClick={() => setOpen(false)} className="text-xl leading-none text-sub" aria-label="닫기">
              ✕
            </button>
          </div>
          <div ref={boxRef} className="flex-1" />
        </div>
      )}
    </div>
  );
}

function DocUpload({
  kind,
  label,
  value,
  onChange,
}: {
  kind: "idCard" | "bankbook";
  label: string;
  value: string;
  onChange: (path: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("kind", kind);
      const res = await fetch("/api/upload/doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업로드 실패");
      onChange(data.path);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "업로드 실패");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <label className="text-xs text-sub">{label} *</label>
      <div className="mt-1 flex items-center gap-2">
        <input ref={ref} type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn-line px-3 py-2 text-xs">
          {busy ? "업로드 중…" : value ? "다시 첨부" : "파일 첨부"}
        </button>
        {value && <span className="text-xs font-bold text-deal">첨부됨 ✓</span>}
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function SettlementForm({
  status,
  minPayout,
}: {
  status: string;
  minPayout: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({
    residentNo: "",
    address: "",
    bankName: "",
    bankAccount: "",
    accountHolder: "",
    idCardPath: "",
    bankbookPath: "",
    agree: false,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  if (status === "submitted" || status === "verified") {
    return (
      <div className="rounded-xl2 border border-deal/40 bg-deal/5 p-5 text-sm">
        <div className="font-bold text-deal">정산 정보 등록 완료 ✓</div>
        <p className="mt-1 text-ink/70">
          {status === "verified" ? "관리자 확인이 완료되어 정산이 가능합니다." : "관리자 확인 후 정산이 진행됩니다."}
        </p>
        <p className="mt-2 text-xs text-sub">변경이 필요하면 고객센터로 문의해주세요.</p>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await submitSettlement(f);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-xl2 border border-line p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold">정산 정보 등록</div>
          <p className="mt-1 text-xs text-sub">
            수익금 지급을 위해 필요합니다. (최소 지급 금액 {minPayout.toLocaleString()}원)
            <br />
            주민등록번호는 <b>암호화 저장</b>되며 원천징수 신고 목적으로만 사용됩니다.
          </p>
        </div>
        <button onClick={() => setOpen(!open)} className="btn-brand shrink-0 px-3 py-2 text-xs">
          {open ? "닫기" : "등록하기"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 space-y-3 border-t border-line pt-5">
          <div>
            <label className="text-xs text-sub">주민등록번호 * (13자리)</label>
            <input
              className="field mt-1"
              inputMode="numeric"
              placeholder="숫자만 입력"
              value={f.residentNo}
              onChange={(e) => set("residentNo", e.target.value)}
            />
          </div>
          <AddressField value={f.address} onChange={(v) => set("address", v)} />
          <div className="grid gap-3">
            <div>
              <label className="text-xs text-sub">은행명 *</label>
              <input className="field mt-1" value={f.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="국민은행" />
            </div>
            <div className="">
              <label className="text-xs text-sub">계좌번호 *</label>
              <input className="field mt-1" value={f.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-sub">예금주 * (본인 명의만 가능)</label>
            <input className="field mt-1" value={f.accountHolder} onChange={(e) => set("accountHolder", e.target.value)} />
          </div>

          <div className="grid gap-3">
            <DocUpload kind="idCard" label="신분증 사본" value={f.idCardPath} onChange={(p) => set("idCardPath", p)} />
            <DocUpload kind="bankbook" label="통장 사본" value={f.bankbookPath} onChange={(p) => set("bankbookPath", p)} />
          </div>

          <label className="flex items-start gap-2 rounded-lg bg-[#f7f6f4] p-3 text-xs">
            <input type="checkbox" checked={f.agree} onChange={(e) => set("agree", e.target.checked)} className="mt-0.5" />
            <span>
              [필수] 정산을 위한 개인정보 수집·이용에 동의합니다. (소득세법 제145조 원천징수 신고 목적, 5년 보관)
              <a href="/terms?doc=privacy_settlement" target="_blank" className="ml-1 underline">
                전문 보기
              </a>
            </span>
          </label>

          <button className="btn-brand w-full" disabled={pending || !f.agree}>
            {pending ? "제출 중…" : "정산 정보 제출"}
          </button>
          {msg && <p className={`text-center text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
        </form>
      )}
    </div>
  );
}
