import Link from "next/link";
import { prisma } from "@/lib/db";
import { won } from "@/lib/format";
import { listGrades } from "@/lib/grade";
import { getPartnerEngagement } from "@/lib/analytics";
import PendingRow from "./PendingRow";
import ForceDeleteButton from "./ForceDeleteButton";
import GradeSelect from "./GradeSelect";
import SettlementCell from "./SettlementCell";
import { decryptSensitive, maskResidentNo, maskAccount } from "@/lib/crypto";

export const dynamic = "force-dynamic";

// ── 기간 기준 ──
// joined   : 그 기간에 가입한 회원만 (지표는 전체 누적)
// login    : 그 기간에 로그인한 회원만 (지표는 전체 누적)
// activity : 회원은 전부, 지표(AI/코드/판매/수수료)만 그 기간으로 집계
const BASIS = [
  { key: "joined", label: "가입일" },
  { key: "login", label: "최근 로그인" },
  { key: "activity", label: "실적 발생일" },
] as const;

const STATUS = [
  { key: "approved", label: "승인" },
  { key: "pending", label: "대기" },
  { key: "rejected", label: "반려" },
  { key: "all", label: "전체" },
] as const;

/** YYYY-MM-DD 를 한국시간 기준 하루의 시작/끝으로 변환 */
function kstStart(d: string) {
  return new Date(`${d}T00:00:00+09:00`);
}
function kstEnd(d: string) {
  return new Date(`${d}T23:59:59.999+09:00`);
}
/** 오늘로부터 n일 전 날짜 문자열 (KST) */
function daysAgo(n: number) {
  const t = Date.now() + 9 * 3600_000 - n * 86400_000;
  return new Date(t).toISOString().slice(0, 10);
}
function fmtDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
function fmtDateTime(d: Date | null) {
  if (!d) return "-";
  const s = new Date(d.getTime() + 9 * 3600_000).toISOString();
  return `${s.slice(5, 10)} ${s.slice(11, 16)}`;
}
/** 숫자만 남기기 (전화번호 검색용) */
function digits(s: string) {
  return s.replace(/\D/g, "");
}

type SP = Record<string, string | undefined>;
type Row = {
  id: string;
  name: string;
  username: string;
  phone: string | null;
  code: string | null;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  loginCount: number;
  gradeId: string | null;
  gradeName: string;
  settlementStatus: string;
  aiCount: number;
  linkCount: number;
  saleCount: number;
  commission: number;
  totalSaleCount: number;
  visits: number;        // 방문 횟수(세션)
  productViews: number;  // 상품 조회수
  lastVisitAt: Date | null;
  vAvail: number;        // 20% 바우처 — 사용가능
  vApplied: number;      // 적용중
  vUsed: number;         // 사용완료
  cPosts: number;        // 커뮤니티 글 수
  cComments: number;     // 댓글 수
  cLikes: number;        // 누른 좋아요 수
  appLastAt: Date | null; // 앱으로 접속한 마지막 시각
  appUser: boolean;       // 앱 사용 이력(앱 방문 or 푸시토큰 보유)
  lastPlatform: string | null; // 마지막 접속 기기 web|app
  pushOn: boolean;        // 앱 푸시 수신(활성 토큰 보유)
  residentNoEnc: string | null;
  address: string | null;
  bankName: string | null;
  bankAccount: string | null;
  accountHolder: string | null;
  idCardUrl: string | null;
  bankbookUrl: string | null;
};

const SORTERS: Record<string, (a: Row, b: Row) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, "ko"),
  username: (a, b) => a.username.localeCompare(b.username),
  phone: (a, b) => digits(a.phone ?? "").localeCompare(digits(b.phone ?? "")),
  code: (a, b) => (a.code ?? "").localeCompare(b.code ?? ""),
  grade: (a, b) => a.gradeName.localeCompare(b.gradeName, "ko"),
  settlement: (a, b) => a.settlementStatus.localeCompare(b.settlementStatus),
  createdAt: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  lastLoginAt: (a, b) => (a.lastLoginAt?.getTime() ?? 0) - (b.lastLoginAt?.getTime() ?? 0),
  loginCount: (a, b) => a.loginCount - b.loginCount,
  aiCount: (a, b) => a.aiCount - b.aiCount,
  linkCount: (a, b) => a.linkCount - b.linkCount,
  saleCount: (a, b) => a.saleCount - b.saleCount,
  commission: (a, b) => a.commission - b.commission,
  visits: (a, b) => a.visits - b.visits,
  vAvail: (a, b) => a.vAvail - b.vAvail,
  cPosts: (a, b) => a.cPosts - b.cPosts,
  productViews: (a, b) => a.productViews - b.productViews,
  lastVisitAt: (a, b) => (a.lastVisitAt?.getTime() ?? 0) - (b.lastVisitAt?.getTime() ?? 0),
  appUser: (a, b) => Number(a.appUser) - Number(b.appUser),
  appLastAt: (a, b) => (a.appLastAt?.getTime() ?? 0) - (b.appLastAt?.getTime() ?? 0),
  pushOn: (a, b) => Number(a.pushOn) - Number(b.pushOn),
};

export default async function AdminPartners({ searchParams }: { searchParams: SP }) {
  const q = (searchParams.q ?? "").trim();
  const basis = (BASIS.find((b) => b.key === searchParams.basis)?.key ?? "joined") as string;
  const status = (STATUS.find((s) => s.key === searchParams.status)?.key ?? "approved") as string;
  const from = searchParams.from ?? "";
  const to = searchParams.to ?? "";
  const sort = SORTERS[searchParams.sort ?? ""] ? searchParams.sort! : "createdAt";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";

  const hasRange = !!(from || to);
  const range = hasRange
    ? { ...(from ? { gte: kstStart(from) } : {}), ...(to ? { lte: kstEnd(to) } : {}) }
    : undefined;
  // 실적 집계에만 기간을 적용할지 (basis=activity)
  const metricRange = basis === "activity" ? range : undefined;

  // 회원 자체를 거르는 조건
  const partnerWhere: Record<string, unknown> = {};
  if (status !== "all") partnerWhere.status = status;
  if (basis === "joined" && range) partnerWhere.createdAt = range;
  if (basis === "login" && range) partnerWhere.lastLoginAt = range;
  if (q) {
    const d = digits(q);
    partnerWhere.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      ...(d.length >= 2 ? [{ phone: { contains: d } }] : []),
      ...(q ? [{ phone: { contains: q } }] : []),
    ];
  }

  // 방문/활동 지표: basis=activity면 선택 기간, 아니면 전체 누적
  const engFrom = basis === "activity" && from ? from : undefined;
  const engTo = basis === "activity" && to ? to : undefined;

  const [partners, grades, aiAgg, linkAgg, saleAgg, saleTotalAgg, pendingList, engMap, voucherAgg, cPostAgg, cCommentAgg, cLikeAgg, appVisitAgg, pushAgg, lastPlatformRows] = await Promise.all([
    prisma.partner.findMany({ where: partnerWhere }),
    listGrades(),
    prisma.tryOnImage.groupBy({
      by: ["partnerId"],
      _count: { _all: true },
      ...(metricRange ? { where: { createdAt: metricRange } } : {}),
    }),
    prisma.issuedLink.groupBy({
      by: ["partnerId"],
      _count: { _all: true },
      ...(metricRange ? { where: { createdAt: metricRange } } : {}),
    }),
    prisma.sale.groupBy({
      by: ["partnerId"],
      _count: { _all: true },
      _sum: { commission: true },
      ...(metricRange ? { where: { orderedAt: metricRange } } : {}),
    }),
    // 등급 자동판정(첫구매/일반)은 항상 전체 누적 실적 기준
    prisma.sale.groupBy({ by: ["partnerId"], _count: { _all: true } }),
    prisma.partner.findMany({ where: { active: true, code: null, status: { not: "rejected" } }, orderBy: { createdAt: "desc" } }),
    getPartnerEngagement(engFrom, engTo),
    // 20% 바우처는 항상 전체 누적 (기간 무관)
    prisma.rewardVoucher.groupBy({ by: ["partnerId", "status"], _count: { _all: true } }),
    // 커뮤니티 활동 (전체 누적)
    prisma.communityPost.groupBy({ by: ["partnerId"], _count: { _all: true } }),
    prisma.communityComment.groupBy({ by: ["partnerId"], _count: { _all: true } }),
    prisma.communityLike.groupBy({ by: ["partnerId"], _count: { _all: true } }),
    // 앱 사용 흔적: 앱 플랫폼 방문의 마지막 시각 (전체 누적)
    prisma.visit.groupBy({ by: ["partnerId"], where: { platform: "app", partnerId: { not: null } }, _max: { createdAt: true } }),
    // 푸시 수신 상태: 활성 토큰 보유 회원
    prisma.pushToken.groupBy({ by: ["partnerId"], where: { active: true, partnerId: { not: null } }, _count: { _all: true } }),
    // 마지막 접속 플랫폼(가장 최근 방문의 web/app)
    prisma.$queryRaw<{ partnerId: string; platform: string }[]>`
      SELECT DISTINCT ON ("partnerId") "partnerId", platform
      FROM "Visit" WHERE "partnerId" IS NOT NULL
      ORDER BY "partnerId", "createdAt" DESC`,
  ]);
  const cPostMap = new Map(cPostAgg.map((r) => [r.partnerId, r._count._all]));
  const cCommentMap = new Map(cCommentAgg.map((r) => [r.partnerId, r._count._all]));
  const cLikeMap = new Map(cLikeAgg.map((r) => [r.partnerId, r._count._all]));
  // 앱/푸시 지표 맵
  const appLastMap = new Map(appVisitAgg.filter((r) => r.partnerId).map((r) => [r.partnerId as string, r._max.createdAt]));
  const pushSet = new Set(pushAgg.filter((r) => r.partnerId).map((r) => r.partnerId as string));
  const lastPlatformMap = new Map(lastPlatformRows.map((r) => [r.partnerId, r.platform]));

  const gradeOptions = grades.map((g) => ({ id: g.id, name: g.name, percent: g.percent }));
  const firstName = grades.find((g) => g.systemKey === "first")?.name ?? "첫구매";
  const normalName = grades.find((g) => g.systemKey === "normal")?.name ?? "일반";

  const aiMap = new Map(aiAgg.map((r) => [r.partnerId, r._count._all]));
  const linkMap = new Map(linkAgg.map((r) => [r.partnerId, r._count._all]));
  const saleMap = new Map(saleAgg.map((r) => [r.partnerId, r]));
  const saleTotalMap = new Map(saleTotalAgg.map((r) => [r.partnerId, r._count._all]));
  // 파트너별 바우처 상태 집계
  const vMap = new Map<string, { avail: number; applied: number; used: number }>();
  for (const r of voucherAgg) {
    const cur = vMap.get(r.partnerId) ?? { avail: 0, applied: 0, used: 0 };
    if (r.status === "available") cur.avail += r._count._all;
    else if (r.status === "applied") cur.applied += r._count._all;
    else if (r.status === "used") cur.used += r._count._all;
    vMap.set(r.partnerId, cur);
  }

  const rows: Row[] = partners.map((p) => {
    const vc = vMap.get(p.id) ?? { avail: 0, applied: 0, used: 0 };
    const totalSaleCount = saleTotalMap.get(p.id) ?? 0;
    const s = saleMap.get(p.id);
    const eng = engMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      username: p.username,
      phone: p.phone,
      code: p.code,
      status: p.status,
      createdAt: p.createdAt,
      lastLoginAt: p.lastLoginAt,
      loginCount: p.loginCount,
      gradeId: p.gradeId,
      gradeName: p.gradeId
        ? grades.find((g) => g.id === p.gradeId)?.name ?? "-"
        : totalSaleCount > 0
          ? normalName
          : firstName,
      settlementStatus: p.settlementStatus,
      aiCount: aiMap.get(p.id) ?? 0,
      linkCount: linkMap.get(p.id) ?? 0,
      saleCount: s?._count._all ?? 0,
      commission: s?._sum.commission ?? 0,
      totalSaleCount,
      visits: eng?.sessions ?? 0,
      productViews: eng?.productViews ?? 0,
      lastVisitAt: eng?.lastVisit ?? null,
      vAvail: vc.avail,
      vApplied: vc.applied,
      vUsed: vc.used,
      cPosts: cPostMap.get(p.id) ?? 0,
      cComments: cCommentMap.get(p.id) ?? 0,
      cLikes: cLikeMap.get(p.id) ?? 0,
      appLastAt: appLastMap.get(p.id) ?? null,
      appUser: appLastMap.has(p.id) || pushSet.has(p.id),
      lastPlatform: lastPlatformMap.get(p.id) ?? null,
      pushOn: pushSet.has(p.id),
      residentNoEnc: p.residentNoEnc,
      address: p.address,
      bankName: p.bankName,
      bankAccount: p.bankAccount,
      accountHolder: p.accountHolder,
      idCardUrl: p.idCardUrl,
      bankbookUrl: p.bankbookUrl,
    };
  });

  rows.sort((a, b) => (dir === "asc" ? 1 : -1) * SORTERS[sort](a, b));

  const sum = rows.reduce(
    (acc, r) => ({
      loginCount: acc.loginCount + r.loginCount,
      visits: acc.visits + r.visits,
      productViews: acc.productViews + r.productViews,
      aiCount: acc.aiCount + r.aiCount,
      linkCount: acc.linkCount + r.linkCount,
      saleCount: acc.saleCount + r.saleCount,
      commission: acc.commission + r.commission,
    }),
    { loginCount: 0, visits: 0, productViews: 0, aiCount: 0, linkCount: 0, saleCount: 0, commission: 0 }
  );

  /** 현재 조건을 유지한 채 일부만 바꾼 URL */
  function href(patch: SP) {
    const next = { q, basis, status, from, to, sort, dir, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, String(v));
    return `/admin/partners?${sp.toString()}`;
  }

  /** 정렬 가능한 헤더 셀 */
  function Th({ k, label, right }: { k: string; label: string; right?: boolean }) {
    const on = sort === k;
    return (
      <th className={`whitespace-nowrap py-2 ${right ? "text-right" : "text-left"}`}>
        <Link
          href={href({ sort: k, dir: on && dir === "desc" ? "asc" : "desc" })}
          className={`inline-flex items-center gap-0.5 hover:text-ink ${on ? "font-bold text-brand" : ""}`}
        >
          {label}
          <span className={on ? "" : "text-line"}>{on ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
        </Link>
      </th>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">회원(파트너) 관리</h1>

      {/* 가입 신청 대기 */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">
          판매코드 미발급 <span className="text-brand">({pendingList.length})</span>
        </h2>
        {pendingList.length === 0 ? (
          <div className="card p-6 text-sm text-sub">코드 미발급 회원이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {pendingList.map((p) => (
              <PendingRow
                key={p.id}
                p={{
                  id: p.id,
                  username: p.username,
                  name: p.name,
                  phone: p.phone,
                  verified: p.verified,
                  createdAt: fmtDate(p.createdAt),
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 필터 ── */}
      <form method="get" className="mb-4 space-y-3 rounded-xl2 border border-line bg-[#fbfaf9] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sub">검색 (이름 · 아이디 · 전화번호)</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="홍길동 / 01012345678"
              className="field w-56"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sub">기간 기준</span>
            <select name="basis" defaultValue={basis} className="field w-32">
              {BASIS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sub">시작일</span>
            <input type="date" name="from" defaultValue={from} className="field w-40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sub">종료일</span>
            <input type="date" name="to" defaultValue={to} className="field w-40" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-sub">상태</span>
            <select name="status" defaultValue={status} className="field w-24">
              {STATUS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
          <button className="btn-brand h-[42px] px-5">조회</button>
          <Link href="/admin/partners" className="btn-line h-[42px] px-4 leading-[26px]">
            초기화
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 text-sub">빠른 선택</span>
          {[
            { label: "오늘", f: daysAgo(0), t: daysAgo(0) },
            { label: "7일", f: daysAgo(6), t: daysAgo(0) },
            { label: "30일", f: daysAgo(29), t: daysAgo(0) },
            { label: "90일", f: daysAgo(89), t: daysAgo(0) },
          ].map((r) => (
            <Link
              key={r.label}
              href={href({ from: r.f, to: r.t })}
              className={`rounded-full border px-3 py-1 font-semibold ${
                from === r.f && to === r.t
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink/70 hover:border-ink/30"
              }`}
            >
              {r.label}
            </Link>
          ))}
          <Link
            href={href({ from: "", to: "" })}
            className={`rounded-full border px-3 py-1 font-semibold ${
              !hasRange ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/70 hover:border-ink/30"
            }`}
          >
            전체기간
          </Link>
          <span className="ml-2 text-sub">
            {basis === "activity"
              ? "· 회원은 전부 표시하고, AI·코드·판매·수수료만 이 기간으로 집계합니다."
              : `· ${BASIS.find((b) => b.key === basis)!.label}이 이 기간에 속한 회원만 표시합니다. (지표는 전체 누적)`}
          </span>
        </div>
      </form>

      {/* ── 목록 ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">
          회원 목록 <span className="text-brand">({rows.length})</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2140px] text-sm">
            <thead className="border-b border-line text-sub">
              <tr>
                <Th k="name" label="이름" />
                <Th k="username" label="아이디" />
                <Th k="phone" label="연락처" />
                <Th k="code" label="코드" />
                <Th k="grade" label="등급" />
                <Th k="settlement" label="정산정보" />
                <Th k="createdAt" label="가입일" />
                <Th k="lastLoginAt" label="최근 로그인" />
                <Th k="loginCount" label="로그인" right />
                <Th k="visits" label="방문" right />
                <Th k="productViews" label="상품조회" right />
                <Th k="lastVisitAt" label="최근 방문" />
                <Th k="appUser" label="앱설치" />
                <Th k="appLastAt" label="앱 최근접속" />
                <th className="whitespace-nowrap px-2 py-2 text-left font-normal">최근기기</th>
                <Th k="pushOn" label="푸시" />
                <Th k="aiCount" label="AI 이미지" right />
                <Th k="linkCount" label="코드 생성" right />
                <Th k="saleCount" label="판매" right />
                <Th k="commission" label="수수료" right />
                <Th k="vAvail" label="20% 바우처" right />
                <Th k="cPosts" label="커뮤니티" right />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={22} className="py-8 text-center text-sub">
                    조건에 맞는 회원이 없습니다.
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-line align-middle">
                  <td className="whitespace-nowrap py-2 font-medium">
                    <div className="flex items-center gap-1">
                      {p.name}
                      {p.status !== "approved" && (
                        <span className="rounded bg-line px-1 text-[10px] text-sub">
                          {p.status === "pending" ? "대기" : "반려"}
                        </span>
                      )}
                    </div>
                    {p.status !== "rejected" && <ForceDeleteButton id={p.id} name={p.name} />}
                  </td>
                  <td className="whitespace-nowrap text-sub">@{p.username}</td>
                  <td className="whitespace-nowrap text-sub">{p.phone ?? "-"}</td>
                  <td>
                    {p.code ? (
                      <code className="rounded bg-brandsoft px-1.5 py-0.5 text-xs">{p.code}</code>
                    ) : (
                      <span className="text-sub">-</span>
                    )}
                  </td>
                  <td>
                    <GradeSelect
                      partnerId={p.id}
                      gradeId={p.gradeId}
                      autoName={p.totalSaleCount > 0 ? normalName : firstName}
                      grades={gradeOptions}
                    />
                  </td>
                  <td>
                    <SettlementCell
                      partnerId={p.id}
                      status={p.settlementStatus}
                      residentMasked={maskResidentNo(decryptSensitive(p.residentNoEnc))}
                      address={p.address}
                      bank={p.bankName}
                      accountMasked={maskAccount(p.bankAccount)}
                      holder={p.accountHolder}
                      idCardPath={p.idCardUrl}
                      bankbookPath={p.bankbookUrl}
                    />
                  </td>
                  <td className="whitespace-nowrap text-sub">{fmtDate(p.createdAt)}</td>
                  <td className="whitespace-nowrap text-sub">{fmtDateTime(p.lastLoginAt)}</td>
                  <td className="text-right tabular-nums">{p.loginCount.toLocaleString()}</td>
                  <td className="text-right font-semibold tabular-nums text-brand">{p.visits.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{p.productViews.toLocaleString()}</td>
                  <td className="whitespace-nowrap text-sub">{fmtDateTime(p.lastVisitAt)}</td>
                  <td className="whitespace-nowrap">
                    {p.appUser ? (
                      <span className="rounded bg-brandsoft px-1.5 py-0.5 text-[10px] font-bold text-brand">앱</span>
                    ) : (
                      <span className="text-sub">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-sub">{fmtDateTime(p.appLastAt)}</td>
                  <td className="whitespace-nowrap">
                    {p.lastPlatform === "app" ? (
                      <span className="text-brand">앱</span>
                    ) : p.lastPlatform === "web" ? (
                      <span className="text-sub">웹</span>
                    ) : (
                      <span className="text-sub">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {p.pushOn ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">ON</span>
                    ) : (
                      <span className="text-sub">off</span>
                    )}
                  </td>
                  <td className="text-right tabular-nums">{p.aiCount.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{p.linkCount.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{p.saleCount.toLocaleString()}</td>
                  <td className="whitespace-nowrap text-right font-semibold tabular-nums text-brand">
                    {won(p.commission)}
                  </td>
                  <td className="whitespace-nowrap text-right text-xs tabular-nums">
                    {p.vAvail + p.vApplied + p.vUsed === 0 ? (
                      <span className="text-sub">-</span>
                    ) : (
                      <span className="inline-flex gap-1">
                        {p.vAvail > 0 && <span className="rounded bg-emerald-100 px-1 py-0.5 font-bold text-emerald-700">가능 {p.vAvail}</span>}
                        {p.vApplied > 0 && <span className="rounded bg-amber-100 px-1 py-0.5 font-bold text-amber-700">적용 {p.vApplied}</span>}
                        {p.vUsed > 0 && <span className="rounded bg-line px-1 py-0.5 text-sub">완료 {p.vUsed}</span>}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right text-xs tabular-nums text-ink/70">
                    {p.cPosts + p.cComments + p.cLikes === 0 ? (
                      <span className="text-sub">-</span>
                    ) : (
                      <span>글 {p.cPosts} · 댓 {p.cComments} · ♥ {p.cLikes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line bg-[#fbfaf9] font-bold">
                  <td className="py-2" colSpan={8}>
                    합계 ({rows.length}명)
                  </td>
                  <td className="text-right tabular-nums">{sum.loginCount.toLocaleString()}</td>
                  <td className="text-right tabular-nums text-brand">{sum.visits.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{sum.productViews.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="text-right tabular-nums">{sum.aiCount.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{sum.linkCount.toLocaleString()}</td>
                  <td className="text-right tabular-nums">{sum.saleCount.toLocaleString()}</td>
                  <td className="whitespace-nowrap text-right tabular-nums text-brand">{won(sum.commission)}</td>
                  <td className="text-right text-xs tabular-nums text-emerald-700">
                    가능 {rows.reduce((s, r) => s + r.vAvail, 0).toLocaleString()}
                  </td>
                  <td className="text-right text-xs tabular-nums text-ink/70">
                    글 {rows.reduce((s, r) => s + r.cPosts, 0)} · 댓 {rows.reduce((s, r) => s + r.cComments, 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
