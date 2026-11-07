import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { config } from "./config.js";

const b64 = (value: Buffer | string) => Buffer.from(value).toString("base64url");

export function signPayload(payload: Record<string, unknown>): string {
  const body = b64(JSON.stringify(payload));
  const signature = b64(createHmac("sha256", config.signingSecret).update(body).digest());
  return `${body}.${signature}`;
}

export function verifyPayload<T extends Record<string, unknown>>(token: string): T {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) throw new Error("INVALID_TOKEN");
  const expected = createHmac("sha256", config.signingSecret).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.byteLength !== expected.byteLength || !timingSafeEqual(received, expected)) {
    throw new Error("INVALID_TOKEN");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("TOKEN_EXPIRED");
  }
  return payload;
}

export function pkceS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function encryptText(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", config.masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", b64(iv), b64(tag), b64(ciphertext)].join(".");
}

export function decryptText(envelope: string): string {
  const [version, ivRaw, tagRaw, ciphertextRaw, extra] = envelope.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !ciphertextRaw || extra) {
    throw new Error("INVALID_ENCRYPTED_STATE");
  }
  const decipher = createDecipheriv("aes-256-gcm", config.masterKey, Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
