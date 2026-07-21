# 돈버는 명품샵 — 명품 어필리에이트 판매 플랫폼

기존 고도몰 쇼핑몰의 상품을, 파트너(컨시어지)가 **자기 고유 코드가 붙은 판매 링크**로
발급·공유하고 성과·수익을 확인하는 **어필리에이트 사이트**.

- 프론트: 퀸잇 스타일 쇼핑몰(추천 배너 캐러셀 · 카테고리 · 섹션 · 기획전 · 공지/가이드 게시판)
- 어드민: 상품(스크래핑·엑셀 일괄)·배너·카테고리·섹션·기획전·회원승인·게시판·설정
- 회원: 실명(본인)인증 → 가입 → 승인 → 어필리에이터 등급, 로그인 게이팅
- 기획/설계 문서: [`docs/기획서.md`](docs/기획서.md)

## 로컬 실행

```bash
npm install
cp .env.example .env         # 값 채우기 (AUTH_SECRET 등)
npm run db:push              # DB 스키마 생성
npm run db:seed              # 데모 데이터(선택)
npm run dev                  # http://localhost:3000
```

기본 데모 로그인: `concierge1` / `password1` (승인된 어필리에이터)

## GitHub 올리기

```bash
git add -A
git commit -m "update"
git remote add origin https://github.com/<계정>/<레포>.git   # 최초 1회
git push -u origin main
```

`.env`, `prisma/dev.db`, `public/uploads/*` 는 `.gitignore` 로 제외됩니다(비밀·로컬 데이터).

## 배포

1. 서버/플랫폼에 코드 배포 후 환경변수 설정
   - `SITE_URL`(배포 도메인), `AUTH_SECRET`(임의의 긴 값), `DATABASE_URL`
   - (선택) `NAVER_SITE_VERIFICATION`, `GOOGLE_SITE_VERIFICATION`
2. `npm run build && npm run start`
3. DB 초기화: `npm run db:push` (필요 시 `npm run db:seed`)

> ⚠️ 기본 DB는 SQLite(`prisma/dev.db`)입니다. 서버리스(예: Vercel)에 배포하면
> 파일 DB가 유지되지 않으므로, 운영에서는 `prisma/schema.prisma`의 `datasource`를
> PostgreSQL 등으로 바꾸고 `DATABASE_URL`을 연결하세요. (VPS/상시 서버는 SQLite도 가능)

## SEO

- 타이틀/디스크립션/키워드(어필리에이트 사이트 등) — `src/app/layout.tsx`
- `robots.txt` → `src/app/robots.ts`, `sitemap.xml` → `src/app/sitemap.ts`
- 파비콘 — `src/app/icon.svg`
- 네이버 웹마스터도구/구글 서치콘솔에서 소유확인 코드 발급 → 환경변수에 입력

## 주요 경로

| 경로 | 설명 |
|------|------|
| `/` | 추천상품(배너 캐러셀·카테고리·섹션) |
| `/goods/[goodsNo]` | 상품상세 · 내 코드 만들기 · AI 착용샷 |
| `/exhibition/[id]` | 기획전 페이지 |
| `/board`, `/board/[id]` | 공지/가이드 게시판 |
| `/me` | 내정보(등급·판매내역·수익) |
| `/concierge` | 멤버십 업그레이드 |
| `/admin/*` | 백오피스 |

## 연동 어댑터(교체 지점)

- `src/lib/godomall/scrape.ts` — 상품 스크래핑
- `src/lib/godomall/sales.ts` — 판매내역 pull(고도몰 API/제휴마케팅)
- `src/lib/ai/tryon.ts` — AI 착용샷
- `src/lib/identity.ts` — 실명(본인)인증(PASS/NICE/다날/토스)
- `src/app/api/upload/route.ts` — 이미지 저장(로컬 → S3 등으로 교체)
