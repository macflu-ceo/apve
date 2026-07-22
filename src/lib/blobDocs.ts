// 비공개 문서 저장소(Vercel Blob · Private) — 신분증/통장 사본 전용
// Vercel 연결 시 접두어가 소문자로 생성되는 경우가 있어 둘 다 인식한다.
export function docsToken(): string | undefined {
  return (
    process.env.DOCS_READ_WRITE_TOKEN ||
    (process.env as Record<string, string | undefined>).docs_READ_WRITE_TOKEN ||
    undefined
  );
}

export function docsConfigured(): boolean {
  return !!docsToken();
}
