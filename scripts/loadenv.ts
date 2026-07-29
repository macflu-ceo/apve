// .env 를 process.env 로 로드 (standalone tsx 스크립트는 자동 로드 안 되므로)
import { readFileSync } from "node:fs";
try {
  const txt = readFileSync(new URL("../.env", import.meta.url), "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* .env 없으면 무시 (환경변수로 줄 수 있음) */
}
