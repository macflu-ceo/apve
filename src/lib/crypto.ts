// 민감정보(주민등록번호) 암호화 — AES-256-GCM
// 개인정보보호법상 주민등록번호는 암호화 저장이 의무입니다.
import crypto from "crypto";

const SECRET = process.env.SETTLEMENT_SECRET || process.env.AUTH_SECRET || "dev-secret-change-me";
const KEY = crypto.scryptSync(SECRET, "donbeon-settlement-salt", 32);

export function encryptSensitive(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSensitive(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [ivB, tagB, encB] = payload.split(".");
    if (!ivB || !tagB || !encB) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encB, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** 900101-1****** 형태로 마스킹 */
export function maskResidentNo(plain: string | null): string {
  if (!plain) return "-";
  const digits = plain.replace(/[^0-9]/g, "");
  if (digits.length < 7) return "-";
  return `${digits.slice(0, 6)}-${digits[6]}${"*".repeat(6)}`;
}

/** 계좌번호 뒷자리 마스킹 */
export function maskAccount(acc: string | null): string {
  if (!acc) return "-";
  const s = acc.replace(/\s/g, "");
  if (s.length <= 4) return s;
  return s.slice(0, s.length - 4) + "****";
}
