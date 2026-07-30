// catalog.ts 가 import 시점에 읽는 GODO_SALES_* 를 미리 세팅.
//   반드시 catalog.ts import 보다 먼저 import 될 것.
// 키는 커밋하지 않고, 배포된 viaelite 컨트롤러 소스의 const API_KEY 에서 런타임에 읽음.
import { readFileSync } from "node:fs";

function godoKey(): string {
  if (process.env.GODO_SALES_API_KEY) return process.env.GODO_SALES_API_KEY;
  try {
    const php = readFileSync("/Users/leegeungjeong/viaelite-ftp/module/Controller/Api/Concierge/CatalogController.php", "utf8");
    const m = php.match(/const\s+API_KEY\s*=\s*'([^']+)'/);
    if (m) return m[1];
  } catch { /* noop */ }
  try {
    const t = readFileSync("/Users/leegeungjeong/lgj-aiagent/.env", "utf8");
    const m = t.match(/^GODO_API_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch { /* noop */ }
  return "";
}

process.env.GODO_SALES_API_KEY = godoKey();
if (!process.env.GODO_SALES_API_URL) process.env.GODO_SALES_API_URL = "https://api.viaelite.co.kr/concierge/sales";
