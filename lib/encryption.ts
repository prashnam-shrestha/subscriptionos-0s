import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY =
  process.env.ENCRYPTION_KEY || "v0_subscription_os_secret_key_32";
const IV_LENGTH = 16;

function getFormattedKey(): Buffer {
  return Buffer.from(SECRET_KEY.padEnd(32, "0").slice(0, 32));
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getFormattedKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    const textParts = encryptedText.split(":");
    const ivHex = textParts.shift();
    if (!ivHex) return "Decrypt Error";

    const iv = Buffer.from(ivHex, "hex");
    const encryptedData = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getFormattedKey(), iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return "[Unable to Decrypt]";
  }
}